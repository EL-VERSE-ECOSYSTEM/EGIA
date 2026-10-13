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
  user as userTable,
  notification
} from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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

export async function payAdultRegistration() {
  const { profile } = await getParentProfile()
  const enrollment = await db.query.adultEducationEnrollment.findFirst({
    where: eq(adultEducationEnrollment.parentId, profile.id)
  })

  if (!enrollment) throw new Error('Enrollment not found.')
  if (enrollment.registrationPaid) throw new Error('Registration is already paid.')

  const reference = `EGIA-ADULT-REG-${Date.now()}-${randomUUID().slice(0, 8)}`
  const paymentId = randomUUID()

  await db.transaction(async (tx) => {
    // Record payment
    await tx.insert(adultEducationPayment).values({
      id: paymentId,
      parentId: profile.id,
      amount: '2500.00',
      paymentType: 'REGISTRATION',
      reference,
      status: 'success',
      paidAt: new Date()
    })

    // Update enrollment - initial period valid for 8 days after enrollment before weekly payment starts
    const weeklyPaidUntil = new Date()
    weeklyPaidUntil.setDate(weeklyPaidUntil.getDate() + 8)

    await tx.update(adultEducationEnrollment)
      .set({
        status: 'ACTIVE',
        registrationPaid: true,
        weeklyPaidUntil,
        updatedAt: new Date()
      })
      .where(eq(adultEducationEnrollment.id, enrollment.id))
  })

  // Create real-time notification
  try {
    await db.insert(notification).values({
      id: randomUUID(),
      userId: profile.userId,
      title: 'Adult Education Activated',
      message: 'Your Adult Education enrollment is now active! You have full access to your class materials, live sessions, and assignments for the next 7 days.',
      type: 'success',
      createdAt: new Date()
    })
  } catch (err) {
    console.warn('Could not post notification:', err)
  }

  revalidatePath('/dashboard/parent/overview')
  revalidatePath('/dashboard/parent/payments/dashboard')
  return { success: true }
}

export async function payAdultWeekly() {
  const { profile } = await getParentProfile()
  const enrollment = await db.query.adultEducationEnrollment.findFirst({
    where: eq(adultEducationEnrollment.parentId, profile.id)
  })

  if (!enrollment) throw new Error('Enrollment not found.')
  if (!enrollment.registrationPaid) throw new Error('Please pay registration fee first.')

  const reference = `EGIA-ADULT-WK-${Date.now()}-${randomUUID().slice(0, 8)}`
  const paymentId = randomUUID()

  await db.transaction(async (tx) => {
    // Record payment
    await tx.insert(adultEducationPayment).values({
      id: paymentId,
      parentId: profile.id,
      amount: '2000.00',
      paymentType: 'WEEKLY',
      reference,
      status: 'success',
      paidAt: new Date()
    })

    // Extend weekly access
    const currentPaidUntil = enrollment.weeklyPaidUntil ? new Date(enrollment.weeklyPaidUntil) : new Date()
    const baseDate = currentPaidUntil > new Date() ? currentPaidUntil : new Date()
    const newPaidUntil = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000)

    await tx.update(adultEducationEnrollment)
      .set({
        status: 'ACTIVE',
        weeklyPaidUntil: newPaidUntil,
        updatedAt: new Date()
      })
      .where(eq(adultEducationEnrollment.id, enrollment.id))
  })

  revalidatePath('/dashboard/parent/overview')
  revalidatePath('/dashboard/parent/payments/dashboard')
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
export async function appointAdultTeacher(teacherId: string) {
  const session = await auth.getSession()
  const userRole = session?.user?.role?.toUpperCase()
  if (!session?.user || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
    throw new Error('Only administrators can appoint teachers for Adult Education.')
  }

  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, 'adult_education_teacher_id')
  })

  if (existing) {
    await db.update(systemSettings)
      .set({ value: teacherId, updatedAt: new Date() })
      .where(eq(systemSettings.key, 'adult_education_teacher_id'))
  } else {
    await db.insert(systemSettings).values({
      id: randomUUID(),
      key: 'adult_education_teacher_id',
      value: teacherId,
      type: 'string',
      description: 'The appointed teacher for Adult Education classes.',
      updatedAt: new Date()
    })
  }

  revalidatePath('/dashboard/admin/settings')
  return { success: true }
}

export async function getAppointedTeacher() {
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, 'adult_education_teacher_id')
  })

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

  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, 'adult_education_teacher_id')
  })

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
