'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  adultEducationEnrollment,
  adultEducationPayment,
  adultEducationClass,
  systemSettings,
  parent,
  teacher,
  transactions
} from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { initializePaystackPayment } from '@/lib/payments/service'

async function getParentProfile() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const profile = await db.query.parent.findFirst({
    where: eq(parent.userId, session.user.id)
  })
  if (!profile) throw new Error('Parent profile not found')
  return { session, profile }
}

export async function checkWeeklyPaymentStatus() {
  const session = await auth.getSession()
  if (!session?.user) return { enrolled: false, isPaid: false }
  const profile = await db.query.parent.findFirst({
    where: eq(parent.userId, session.user.id)
  })
  if (!profile) return { enrolled: false, isPaid: false }

  const enrollment = await db.query.adultEducationEnrollment.findFirst({
    where: eq(adultEducationEnrollment.parentId, profile.id)
  })

  if (!enrollment) return { enrolled: false, isPaid: false }

  if (!enrollment.registrationPaid) {
    return { enrolled: true, enrollment, isPaid: false, reason: 'Registration fee not paid' }
  }

  const now = new Date()
  const weeklyPaidUntil = enrollment.weeklyPaidUntil ? new Date(enrollment.weeklyPaidUntil) : null

  if (!weeklyPaidUntil || now > weeklyPaidUntil) {
    return { enrolled: true, enrollment, isPaid: false, reason: 'Weekly fee expired' }
  }

  // Check if we are within 1 week of registration to trigger notice
  const regDate = new Date(enrollment.createdAt)
  const oneWeekAfterReg = new Date(regDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  const showPaymentNotice = now >= oneWeekAfterReg

  return { enrolled: true, enrollment, isPaid: true, showPaymentNotice }
}

export async function enrollInAdultEducation(data: {
  daysOfWeek: string[]
  subjectToLearn: string
  preferredTime: string
  passwordConfirm: string
}) {
  const { session, profile } = await getParentProfile()

  if (!data.daysOfWeek || data.daysOfWeek.length === 0) {
    throw new Error('Please select at least one day of the week.')
  }
  if (!data.subjectToLearn) throw new Error('Please specify what you want to learn.')
  if (!data.preferredTime) throw new Error('Please select your preferred time of day.')
  if (!data.passwordConfirm) throw new Error('Password confirmation is required.')

  // Confirm user password securely via Supabase Auth client
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { error } = await supabase.auth.signInWithPassword({
    email: session.user.email || '',
    password: data.passwordConfirm
  })

  if (error) {
    throw new Error('Password confirmation failed. Please enter your correct login password.')
  }

  // Check if already enrolled
  const existing = await db.query.adultEducationEnrollment.findFirst({
    where: eq(adultEducationEnrollment.parentId, profile.id)
  })

  if (existing) {
    throw new Error('You are already enrolled or have a pending enrollment.')
  }

  const enrollmentId = randomUUID()
  await db.insert(adultEducationEnrollment).values({
    id: enrollmentId,
    parentId: profile.id,
    daysOfWeek: data.daysOfWeek,
    subjectToLearn: data.subjectToLearn,
    preferredTime: data.preferredTime,
    status: 'PENDING_REGISTRATION_PAYMENT',
    registrationPaid: false,
    weeklyPaidUntil: null,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  revalidatePath('/dashboard/parent/overview')
  revalidatePath('/dashboard/parent/payments/dashboard')
  return { success: true }
}

async function initializeAdultEducationPayment(paymentType: 'REGISTRATION' | 'WEEKLY') {
  const { session, profile } = await getParentProfile()
  const enrollment = await db.query.adultEducationEnrollment.findFirst({
    where: eq(adultEducationEnrollment.parentId, profile.id)
  })

  if (!enrollment) throw new Error('Enrollment not found.')
  if (paymentType === 'REGISTRATION' && enrollment.registrationPaid) throw new Error('Registration is already paid.')
  if (paymentType === 'WEEKLY' && !enrollment.registrationPaid) throw new Error('Please pay registration fee first.')
  if (!session.user.email) throw new Error('A valid account email is required for Paystack checkout.')

  const amount = paymentType === 'REGISTRATION' ? 2500 : 2000
  const reference = `adult-${paymentType.toLowerCase()}-${randomUUID()}`
  const metadata = { paymentType: `ADULT_EDUCATION_${paymentType}`, enrollmentId: enrollment.id, parentId: profile.id }
  const now = new Date()
  await db.insert(transactions).values({
    id: randomUUID(), reference, amount: amount.toFixed(2), currency: 'NGN', status: 'pending',
    customerEmail: session.user.email, description: `Adult education ${paymentType.toLowerCase()} payment`,
    metadata, createdAt: now, updatedAt: now,
  })
  try {
    const checkout = await initializePaystackPayment({
      amount, customerEmail: session.user.email, customerName: session.user.name || 'Parent',
      reference, description: `Adult education ${paymentType.toLowerCase()} payment`, metadata,
      redirectUrl: `${(process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`,
    })
    await db.update(transactions).set({ checkoutUrl: checkout.checkoutUrl, updatedAt: new Date() }).where(eq(transactions.reference, reference))
    return { success: true, checkoutUrl: checkout.checkoutUrl, reference }
  } catch (error) {
    await db.update(transactions).set({ status: 'failed', updatedAt: new Date() }).where(and(eq(transactions.reference, reference), eq(transactions.status, 'pending')))
    throw error
  }
}

export async function payAdultRegistration() {
  return initializeAdultEducationPayment('REGISTRATION')
}

export async function payAdultWeekly() {
  return initializeAdultEducationPayment('WEEKLY')
}

export async function fulfillAdultEducationPayment(reference: string, amount: string, metadata: Record<string, unknown>) {
  const paymentType = metadata.paymentType === 'ADULT_EDUCATION_REGISTRATION' ? 'REGISTRATION' : metadata.paymentType === 'ADULT_EDUCATION_WEEKLY' ? 'WEEKLY' : null
  const expectedAmount = paymentType === 'REGISTRATION' ? '2500.00' : paymentType === 'WEEKLY' ? '2000.00' : null
  if (!paymentType || amount !== expectedAmount || typeof metadata.enrollmentId !== 'string' || typeof metadata.parentId !== 'string') throw new Error('Adult education payment metadata is invalid.')
  const enrollment = await db.query.adultEducationEnrollment.findFirst({ where: and(eq(adultEducationEnrollment.id, metadata.enrollmentId), eq(adultEducationEnrollment.parentId, metadata.parentId)) })
  if (!enrollment) throw new Error('Adult education enrollment was not found.')
  const existing = await db.query.adultEducationPayment.findFirst({ where: eq(adultEducationPayment.reference, reference) })
  if (existing?.status === 'success') return
  if (paymentType === 'REGISTRATION' && enrollment.registrationPaid) return
  if (paymentType === 'WEEKLY' && !enrollment.registrationPaid) throw new Error('Registration payment is required before weekly access.')
  const now = new Date()
  await db.transaction(async (tx) => {
    const inserted = await tx.insert(adultEducationPayment).values({ id: randomUUID(), parentId: metadata.parentId as string, amount: expectedAmount, paymentType, reference, status: 'success', paidAt: now }).onConflictDoNothing().returning({ id: adultEducationPayment.id })
    if (!inserted.length) return
    if (paymentType === 'REGISTRATION') {
      await tx.update(adultEducationEnrollment).set({ status: 'ACTIVE', registrationPaid: true, weeklyPaidUntil: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), updatedAt: now }).where(and(eq(adultEducationEnrollment.id, enrollment.id), eq(adultEducationEnrollment.registrationPaid, false)))
    } else {
      const paidUntil = enrollment.weeklyPaidUntil ? new Date(enrollment.weeklyPaidUntil) : now
      await tx.update(adultEducationEnrollment).set({ status: 'ACTIVE', weeklyPaidUntil: new Date(Math.max(paidUntil.getTime(), now.getTime()) + 7 * 24 * 60 * 60 * 1000), updatedAt: now }).where(eq(adultEducationEnrollment.id, enrollment.id))
    }
  })
  revalidatePath('/dashboard/parent/overview')
  revalidatePath('/dashboard/parent/payments/dashboard')
}

export async function completeAdultEducationPayment(reference: string) {
  const { profile } = await getParentProfile()
  const transaction = await db.query.transactions.findFirst({ where: eq(transactions.reference, reference) })
  const metadata = transaction?.metadata as Record<string, unknown> | null
  if (!transaction || transaction.status !== 'success' || metadata?.parentId !== profile.id) throw new Error('Paystack has not confirmed this payment for your account.')
  await fulfillAdultEducationPayment(reference, transaction.amount, metadata)
  return { success: true }
}

export async function getAdultClasses(type?: string) {
  // Enforce gating check!
  const status = await checkWeeklyPaymentStatus()
  if (!status.isPaid) {
    throw new Error('Access Denied: Please complete your Adult Education weekly fee of NGN 2000.')
  }

  if (type) {
    return await db.query.adultEducationClass.findMany({
      where: eq(adultEducationClass.type, type),
      orderBy: [desc(adultEducationClass.createdAt)]
    })
  }

  return await db.query.adultEducationClass.findMany({
    orderBy: [desc(adultEducationClass.createdAt)]
  })
}

// Appoint adult education teacher (Admin and Super Admin)
export async function appointAdultTeacher(teacherId: string, targetSchoolId?: string) {
  const session = await auth.getSession()
  const userRole = session?.user?.role?.toUpperCase()
  if (!session?.user || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
    throw new Error('Only administrators can appoint teachers for Adult Education.')
  }

  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  // Fetch target teacher record to verify tenant/school alignment
  const targetTeacherRec = await db.query.teacher.findFirst({
    where: eq(teacher.id, teacherId)
  })

  if (!isSuperAdmin) {
    // School Admin can ONLY appoint teachers in their own school
    const adminSchoolId = session.user.schoolId
    if (!adminSchoolId) {
      throw new Error('School ID is required for School Admin.')
    }

    if (teacherId !== 'admin' && targetTeacherRec && targetTeacherRec.schoolId !== adminSchoolId) {
      throw new Error('Forbidden: School Admin can only appoint teachers within their own school.')
    }
  }

  const schoolIdKey = isSuperAdmin
    ? (targetSchoolId || targetTeacherRec?.schoolId || session.user.schoolId || 'global')
    : session.user.schoolId

  const settingKey = schoolIdKey ? `adult_education_teacher_id_${schoolIdKey}` : 'adult_education_teacher_id'

  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, settingKey)
  })

  if (existing) {
    await db.update(systemSettings)
      .set({ value: teacherId, updatedAt: new Date() })
      .where(eq(systemSettings.key, settingKey))
  } else {
    await db.insert(systemSettings).values({
      id: randomUUID(),
      key: settingKey,
      value: teacherId,
      type: 'string',
      description: 'The appointed teacher for Adult Education classes.',
      updatedAt: new Date()
    })
  }

  // Also update global default fallback key
  await db.insert(systemSettings).values({
    id: randomUUID(),
    key: 'adult_education_teacher_id',
    value: teacherId,
    type: 'string',
    description: 'The appointed teacher for Adult Education classes.',
    updatedAt: new Date()
  }).onConflictDoUpdate({
    target: [systemSettings.key],
    set: { value: teacherId, updatedAt: new Date() }
  })

  revalidatePath('/dashboard/admin/settings')
  revalidatePath('/dashboard/super-admin/overview')
  return { success: true }
}

export async function getAppointedTeacher(schoolId?: string) {
  const session = await auth.getSession()
  const targetSchoolId = schoolId || session?.user?.schoolId

  const settingKey = targetSchoolId ? `adult_education_teacher_id_${targetSchoolId}` : 'adult_education_teacher_id'
  let setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, settingKey)
  })

  if (!setting) {
    setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'adult_education_teacher_id')
    })
  }

  const teacherId = setting?.value || 'admin'
  if (teacherId === 'admin') {
    return { id: 'admin', name: 'Admin (School Principal)' }
  }

  const profile = await db.query.teacher.findFirst({
    where: eq(teacher.id, teacherId)
  })

  return profile ? { id: profile.id, name: `${profile.firstName} ${profile.lastName}` } : { id: 'admin', name: 'Admin (School Principal)' }
}

export async function isTeacherAppointedForAdultEd() {
  const session = await auth.getSession()
  if (!session?.user) return false

  const userRole = session.user.role?.toUpperCase()
  if (['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole)) return true

  const profile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id)
  })

  if (!profile) return false

  const schoolSettingKey = profile.schoolId ? `adult_education_teacher_id_${profile.schoolId}` : 'adult_education_teacher_id'
  let setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, schoolSettingKey)
  })

  if (!setting) {
    setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'adult_education_teacher_id')
    })
  }

  return setting?.value === profile.id
}

export async function createAdultClass(data: {
  title: string
  description?: string
  type: string
  url?: string
  content?: string
  dueDate?: string
}) {
  const isAuthorized = await isTeacherAppointedForAdultEd()
  if (!isAuthorized) throw new Error('Unauthorized: You are not the appointed Adult Education teacher.')

  let teacherId: string | null = null
  const session = await auth.getSession()
  if (session?.user.role !== 'ADMIN') {
    const profile = await db.query.teacher.findFirst({
      where: eq(teacher.userId, session!.user.id)
    })
    teacherId = profile ? profile.id : null
  }

  const parsedDueDate = data.dueDate ? new Date(data.dueDate) : null

  const classId = randomUUID()
  await db.insert(adultEducationClass).values({
    id: classId,
    title: data.title,
    description: data.description || null,
    type: data.type,
    url: data.url || null,
    content: data.content || null,
    dueDate: parsedDueDate,
    teacherId,
    createdAt: new Date()
  })

  revalidatePath('/dashboard/parent/adult-education')
  return { success: true }
}

export async function getAdultPayments() {
  const { profile } = await getParentProfile()
  return await db.query.adultEducationPayment.findMany({
    where: eq(adultEducationPayment.parentId, profile.id),
    orderBy: [desc(adultEducationPayment.paidAt)]
  })
}

export async function getCurrentUserRole() {
  const session = await auth.getSession()
  return session?.user.role?.toLowerCase() as 'admin' | 'teacher' || 'teacher'
}
