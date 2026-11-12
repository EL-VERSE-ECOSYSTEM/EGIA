'use server'

import { db } from '@/lib/db'
import { school, schoolRegistrationApplication, transactions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { sanitizeServerError } from '@/lib/errors'
import { auth } from '@/lib/auth'
import { canSchoolAdminAccess } from '@/lib/auth/school-admin-permissions'
import {
  initializePaystackPayment as serviceInitializePaystackPayment,
  verifyPaystackPayment as serviceVerifyPaystackPayment,
  completeSchoolRenewalTransaction,
} from '@/lib/payments/service'

export interface SchoolRegistrationInput {
  name: string
  location: string
  registeredClasses: any
  allowParents: boolean
  adminName: string
  adminPhone: string
  adminEmail: string
  adminLevel?: string
  proofOfAddressType?: string
  proofOfAddressFileUrl?: string
  logoUrl?: string
  logoPath?: string
  password?: string
  confirmPassword?: string
}

export async function generateSchoolCode(schoolName: string): Promise<string> {
  const prefix = schoolName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase()
    .padEnd(4, 'S')

  const uniqueDigits = Math.floor(10000 + Math.random() * 90000)
  const finalCode = `${prefix}-${uniqueDigits}`

  const existing = await db.select({ id: school.id }).from(school).where(eq(school.code, finalCode))
  if (existing.length > 0) {
    return generateSchoolCode(schoolName)
  }

  return finalCode
}

export async function registerSchoolAction(input: SchoolRegistrationInput) {
  try {
    if (!input.name || !input.adminEmail || !input.adminName || !input.location) {
      return { success: false, error: 'School name, location, contact email, and applicant name are required.' }
    }

    if (input.password || input.confirmPassword) {
      if ((input.password || '').length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long.' }
      }
      if (input.password !== input.confirmPassword) {
        return { success: false, error: 'Passwords do not match.' }
      }
    }

    const schoolId = randomUUID()
    const applicationId = randomUUID()
    const schoolCode = await generateSchoolCode(input.name)
    const paymentReference = `SCH-PAY-${randomUUID().replaceAll('-', '').toUpperCase()}`
    const adminEmail = input.adminEmail.trim().toLowerCase()

    // 1. Create School record in PENDING state
    await db.insert(school).values({
      id: schoolId,
      name: input.name,
      code: schoolCode,
      location: input.location,
      registeredClasses: input.registeredClasses,
      allowParents: input.allowParents,
      adminName: input.adminName,
      adminPhone: input.adminPhone,
      adminEmail: adminEmail,
      paymentStatus: 'PENDING',
      paymentReference: paymentReference,
      logoUrl: input.logoUrl || null,
      logoPath: input.logoPath || null,
      logoUploadedAt: input.logoUrl ? new Date() : null,
    })

    // 2. Create pending school_registration_application (NO auth user or admin role created)
    await db.insert(schoolRegistrationApplication).values({
      id: applicationId,
      schoolId: schoolId,
      applicantEmail: adminEmail,
      applicantPhone: input.adminPhone,
      applicantName: input.adminName,
      schoolName: input.name,
      schoolAddress: input.location,
      proofOfAddressType: input.proofOfAddressType || 'ELECTRICITY_BILL',
      proofOfAddressFileUrl: input.proofOfAddressFileUrl || null,
      documentVerificationStatus: input.proofOfAddressFileUrl ? 'PENDING' : 'PENDING',
      paymentStatus: 'PENDING',
      approvalStatus: 'PENDING_REVIEW',
      adminLevel: input.adminLevel || 'PRIMARY_ADMIN',
      registeredClasses: input.registeredClasses,
      allowParents: input.allowParents,
      paymentReference: paymentReference,
      logoUrl: input.logoUrl || null,
      logoPath: input.logoPath || null,
      submittedAt: new Date(),
    })

    // 3. Initialize Paystack charge via centralized service (NGN 30,000 + NGN 161.25 fee)
    let initRes: any = null
    try {
      initRes = await serviceInitializePaystackPayment({
        schoolId,
        amount: 30161.25,
        currency: 'NGN',
        feeType: 'SCHOOL_REGISTRATION',
        description: `School registration subscription fee for ${input.name}`,
        customerEmail: adminEmail,
        customerName: input.adminName,
        redirectUrl: `${(process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(paymentReference)}`,
        metadata: {
          applicationId,
          schoolId,
          schoolCode,
          paymentType: 'SCHOOL_REGISTRATION',
        },
      })
    } catch (koraErr) {
      console.warn('Paystack payment initialization warning during school registration:', koraErr)
      await db.transaction(async (tx) => {
        await tx.update(school).set({ paymentStatus: 'FAILED', updatedAt: new Date() })
          .where(and(eq(school.id, schoolId), eq(school.paymentReference, paymentReference), eq(school.paymentStatus, 'PENDING')))
        await tx.update(schoolRegistrationApplication).set({ paymentStatus: 'FAILED', updatedAt: new Date() })
          .where(and(eq(schoolRegistrationApplication.id, applicationId), eq(schoolRegistrationApplication.paymentReference, paymentReference), eq(schoolRegistrationApplication.paymentStatus, 'PENDING')))
      })
    }

    return {
      success: true,
      applicationId,
      schoolId,
      schoolCode,
      paymentReference: initRes?.reference || paymentReference,
      checkoutUrl: initRes?.checkoutUrl || '',
      paymentInitializationFailed: !initRes?.checkoutUrl,
    }
  } catch (error: any) {
    const errorMsg = error instanceof Error && error.message ? error.message : 'School registration application could not be initialized.'
    console.error('School registration initialization error:', error)
    return {
      success: false,
      error: errorMsg,
      requestId: randomUUID(),
    }
  }
}

export async function retrySchoolRegistrationPaymentAction(applicationId: string) {
  try {
    if (!applicationId || applicationId.length > 80) return { success: false, error: 'Invalid application reference.' }
    const appRecord = await db.query.schoolRegistrationApplication.findFirst({ where: eq(schoolRegistrationApplication.id, applicationId) })
    if (!appRecord || appRecord.paymentStatus !== 'FAILED' || appRecord.approvalStatus !== 'PENDING_REVIEW') {
      return { success: false, error: 'This application is not awaiting payment.' }
    }
    const schoolRecord = await db.query.school.findFirst({ where: eq(school.id, appRecord.schoolId) })
    if (!schoolRecord) return { success: false, error: 'School application record was not found.' }

    const paymentReference = `SCH-PAY-${randomUUID().replaceAll('-', '').toUpperCase()}`
    const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const claimed = await db.transaction(async (tx) => {
      const updatedApplication = await tx.update(schoolRegistrationApplication)
        .set({ paymentReference, paymentStatus: 'PENDING', updatedAt: new Date() })
        .where(and(eq(schoolRegistrationApplication.id, appRecord.id), eq(schoolRegistrationApplication.paymentStatus, 'FAILED')))
        .returning({ id: schoolRegistrationApplication.id })
      if (!updatedApplication.length) return false
      const updatedSchool = await tx.update(school).set({ paymentReference, paymentStatus: 'PENDING', updatedAt: new Date() })
        .where(and(eq(school.id, schoolRecord.id), eq(school.paymentStatus, 'FAILED')))
        .returning({ id: school.id })
      if (!updatedSchool.length) throw new Error('School payment state changed; retry was not claimed.')
      return true
    })
    if (!claimed) return { success: false, error: 'Another payment retry is already in progress.' }
    let initRes
    try {
      initRes = await serviceInitializePaystackPayment({
        schoolId: schoolRecord.id,
        amount: 30161.25,
        currency: 'NGN',
        feeType: 'SCHOOL_REGISTRATION',
        description: `School registration subscription fee for ${schoolRecord.name}`,
        customerEmail: appRecord.applicantEmail,
        customerName: appRecord.applicantName,
        reference: paymentReference,
        redirectUrl: `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(paymentReference)}`,
        metadata: { applicationId, schoolId: schoolRecord.id, paymentType: 'SCHOOL_REGISTRATION' },
      })
    } catch (error) {
      await db.transaction(async (tx) => {
        await tx.update(school).set({ paymentStatus: 'FAILED', updatedAt: new Date() })
          .where(and(eq(school.id, schoolRecord.id), eq(school.paymentReference, paymentReference), eq(school.paymentStatus, 'PENDING')))
        await tx.update(schoolRegistrationApplication).set({ paymentStatus: 'FAILED', updatedAt: new Date() })
          .where(and(eq(schoolRegistrationApplication.id, appRecord.id), eq(schoolRegistrationApplication.paymentReference, paymentReference), eq(schoolRegistrationApplication.paymentStatus, 'PENDING')))
      })
      throw error
    }

    return { success: true, paymentReference: initRes.reference, checkoutUrl: initRes.checkoutUrl }
  } catch {
    return { success: false, error: 'Paystack checkout could not be started. Please try again.' }
  }
}

export async function uploadSchoolApplicationDocumentAction(input: {
  applicationId: string
  proofOfAddressType?: string
  proofOfAddressFileUrl: string
}) {
  try {
    const existing = await db.select().from(schoolRegistrationApplication).where(eq(schoolRegistrationApplication.id, input.applicationId))
    if (!existing.length) {
      return { success: false, error: 'Application not found.' }
    }

    await db.update(schoolRegistrationApplication)
      .set({
        proofOfAddressType: input.proofOfAddressType || 'ELECTRICITY_BILL',
        proofOfAddressFileUrl: input.proofOfAddressFileUrl,
        documentVerificationStatus: 'PENDING',
        updatedAt: new Date(),
      })
      .where(eq(schoolRegistrationApplication.id, input.applicationId))

    return { success: true }
  } catch (error: any) {
    return sanitizeServerError('uploadSchoolApplicationDocumentAction', error, 'Failed to update proof of address document.')
  }
}

export async function uploadApplicationProofOfAddressAction(
  applicationId: string,
  proofOfAddressFileUrl: string,
  proofOfAddressType?: string
) {
  return uploadSchoolApplicationDocumentAction({
    applicationId,
    proofOfAddressFileUrl,
    proofOfAddressType,
  })
}

export async function getSchoolApplicationStatusAction(applicationId: string) {
  const requestId = randomUUID()
  try {
    if (!applicationId) return { success: false, error: 'Application ID is required.', requestId }

    const { getCachedData } = await import('@/lib/cache')
    return await getCachedData(`school-app-status:${applicationId}`, async () => {
      const appRecord = await db.query.schoolRegistrationApplication.findFirst({
        where: eq(schoolRegistrationApplication.id, applicationId)
      })

      if (!appRecord) {
        return { success: false, error: 'Application not found.', requestId }
      }

      const schRecord = appRecord.schoolId ? await db.query.school.findFirst({
        where: eq(school.id, appRecord.schoolId)
      }) : null

      return {
        success: true,
        application: {
          paymentStatus: appRecord.paymentStatus,
          documentVerificationStatus: appRecord.documentVerificationStatus,
          approvalStatus: appRecord.approvalStatus,
          rejectionReason: appRecord.rejectionReason,
        },
        schoolCode: schRecord?.code || null,
      }
    }, 60, [`school_app:${applicationId}`])
  } catch (error: any) {
    return sanitizeServerError('getSchoolApplicationStatusAction', error, 'Unable to retrieve application status.')
  }
}

export async function confirmSchoolPaymentAction(paymentReference: string) {
  const requestId = randomUUID()
  try {
    const verification = await serviceVerifyPaystackPayment({
      reference: paymentReference,
      expectedAmount: 30161.25,
    })

    if (!verification.success) {
      return { success: false, error: verification.error || 'Payment status not confirmed by gateway.' }
    }

    const existingSchool = await db.select().from(school).where(eq(school.paymentReference, paymentReference))
    let rec: (typeof school.$inferSelect) | null = existingSchool[0] || null

    if (!rec) {
      const appByRef = await db.query.schoolRegistrationApplication.findFirst({
        where: eq(schoolRegistrationApplication.paymentReference, paymentReference)
      })
      if (appByRef?.schoolId) {
        const foundSchool = await db.query.school.findFirst({ where: eq(school.id, appByRef.schoolId) })
        rec = foundSchool || null
      }
    }

    let appRecord: any = null
    if (rec) {
      await db.update(school).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(eq(school.id, rec.id))
      await db.update(schoolRegistrationApplication)
        .set({ paymentStatus: 'SUCCESS', updatedAt: new Date() })
        .where(eq(schoolRegistrationApplication.schoolId, rec.id))

      appRecord = await db.query.schoolRegistrationApplication.findFirst({
        where: eq(schoolRegistrationApplication.schoolId, rec.id)
      })
    }

    return {
      success: true,
      schoolCode: rec?.code || verification.schoolCode,
      schoolName: rec?.name || verification.schoolName,
      amount: 30161.25,
      paidAt: new Date().toISOString(),
      documentVerificationStatus: appRecord?.documentVerificationStatus || 'PENDING',
      approvalStatus: appRecord?.approvalStatus || 'PENDING_REVIEW',
    }
  } catch (error: any) {
    return sanitizeServerError('confirmSchoolPaymentAction', error, 'School registration payment confirmation failed.')
  }
}

export async function getSchoolByCodeAction(code: string) {
  try {
    const cleanCode = code.trim().toUpperCase()
    const result = await db.select({
      id: school.id,
      name: school.name,
      code: school.code,
      location: school.location,
      logoUrl: school.logoUrl,
      allowParents: school.allowParents,
    }).from(school).where(eq(school.code, cleanCode))

    if (!result.length) {
      return { success: false, error: 'Invalid School Code' }
    }
    return { success: true, school: result[0] }
  } catch (error: any) {
    const errorMsg = error instanceof Error && error.message ? error.message : 'Unable to verify school code.'
    console.error('getSchoolByCodeAction error:', error)
    return { success: false, error: errorMsg }
  }
}

export async function getSchoolRegistrationRenewalStatusAction(schoolId: string) {
  try {
    const sch = await db.query.school.findFirst({
      where: eq(school.id, schoolId)
    })

    if (!sch) {
      return { success: false, error: 'School not found.' }
    }

    const now = new Date()
    const paidAt = sch.registrationPaidAt ? new Date(sch.registrationPaidAt) : new Date(sch.createdAt)
    const dueAt = sch.registrationDueDate
      ? new Date(sch.registrationDueDate)
      : new Date(paidAt.getTime() + 60 * 24 * 60 * 60 * 1000) // 2 months (60 days)

    const diffMs = dueAt.getTime() - now.getTime()
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    const isLockedOut = daysRemaining <= 0
    const isWarningPeriod = daysRemaining > 0 && daysRemaining <= 14

    return {
      success: true,
      school: sch,
      daysRemaining,
      isLockedOut,
      isWarningPeriod,
      dueAt: dueAt.toISOString(),
      paidAt: paidAt.toISOString(),
    }
  } catch (error: any) {
    return sanitizeServerError('getSchoolRegistrationRenewalStatusAction', error, 'Failed to compute school renewal status.')
  }
}

export async function initializeSchoolRenewalPaymentAction(schoolId: string) {
  try {
    const session = await auth.getSession()
    if (!session?.user) throw new Error('Sign in before starting a school renewal payment.')
    const actor = session.user
    const canManageRenewal = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN' ||
      (actor.role === 'SCHOOL_ADMIN' && canSchoolAdminAccess(actor.adminLevel, 'update', 'school_settings'))
    if (!canManageRenewal) throw new Error('School administrator access is required.')
    if (actor.role !== 'SUPER_ADMIN' && actor.schoolId !== schoolId) {
      throw new Error('You can only renew your own school subscription.')
    }

    const sch = await db.query.school.findFirst({
      where: eq(school.id, schoolId)
    })

    if (!sch) throw new Error('School not found.')

    const paymentReference = `SCH-RNW-${randomUUID().replaceAll('-', '').toUpperCase()}`
    const description = `Bi-monthly School Registration Renewal for ${sch.name}`
    const metadata = {
      schoolId: sch.id,
      schoolCode: sch.code,
      paymentType: 'SCHOOL_REGISTRATION_RENEWAL',
    }

    await db.insert(transactions).values({
      id: randomUUID(),
      reference: paymentReference,
      amount: '30161.25',
      currency: 'NGN',
      status: 'pending',
      customerEmail: sch.adminEmail,
      customerName: sch.adminName,
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    let initRes
    try {
      initRes = await serviceInitializePaystackPayment({
        reference: paymentReference,
        amount: 30161.25,
        currency: 'NGN',
        feeType: 'SCHOOL_REGISTRATION_RENEWAL',
        description,
        customerEmail: sch.adminEmail,
        customerName: sch.adminName,
        redirectUrl: `${(process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/dashboard/admin/overview?renewal_reference=${encodeURIComponent(paymentReference)}`,
        metadata,
      })
    } catch (error) {
      await db.update(transactions)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(transactions.reference, paymentReference))
      throw error
    }

    return {
      success: true,
      checkoutUrl: initRes.checkoutUrl,
      reference: initRes.reference || paymentReference,
    }
  } catch (error: any) {
    return sanitizeServerError('initializeSchoolRenewalPaymentAction', error, 'Failed to initialize school renewal payment.')
  }
}

export async function confirmSchoolRenewalPaymentAction(paymentReference: string) {
  try {
    const session = await auth.getSession()
    if (!session?.user) return { success: false, error: 'Sign in before confirming a school renewal payment.' }
    const renewalTransaction = await db.query.transactions.findFirst({
      where: eq(transactions.reference, paymentReference),
    })
    const metadata = renewalTransaction?.metadata as Record<string, unknown> | null
    const schoolId = typeof metadata?.schoolId === 'string' ? metadata.schoolId : ''
    const isRenewal = metadata?.paymentType === 'SCHOOL_REGISTRATION_RENEWAL'
    if (!renewalTransaction || !isRenewal || !schoolId || Number(renewalTransaction.amount) !== 30161.25 ||
      !['pending', 'success'].includes(renewalTransaction.status.toLowerCase())) {
      return { success: false, error: 'No matching school renewal payment was found.' }
    }
    const actor = session.user
    const canManageRenewal = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN' ||
      (actor.role === 'SCHOOL_ADMIN' && canSchoolAdminAccess(actor.adminLevel, 'update', 'school_settings'))
    if (!canManageRenewal || (actor.role !== 'SUPER_ADMIN' && actor.schoolId !== schoolId)) {
      return { success: false, error: 'You cannot confirm this school renewal payment.' }
    }

    if (renewalTransaction.status === 'success') {
      const completed = await completeSchoolRenewalTransaction(paymentReference)
      if (completed.success) {
        return { ...completed, nextDueDate: new Date(completed.nextDueDate).toISOString() }
      }
    }

    const verification = await serviceVerifyPaystackPayment({
      reference: paymentReference,
      expectedAmount: 30161.25,
    })

    if (!verification.success) {
      return { success: false, error: verification.error || 'Renewal payment verification failed.' }
    }

    const completed = await completeSchoolRenewalTransaction(paymentReference)
    if (!completed.success) return completed

    revalidatePath('/dashboard/admin/overview')
    revalidatePath('/dashboard/super-admin/schools')
    revalidatePath('/dashboard/super-admin/overview')

    return { ...completed, nextDueDate: new Date(completed.nextDueDate).toISOString() }
  } catch (error: any) {
    return sanitizeServerError('confirmSchoolRenewalPaymentAction', error, 'School renewal confirmation failed.')
  }
}
