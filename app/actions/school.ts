'use server'

import { db } from '@/lib/db'
import { school, schoolRegistrationApplication } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { sanitizeServerError } from '@/lib/errors'
import {
  initializeKorapayPayment as serviceInitializeKorapayPayment,
  verifyKorapayPayment as serviceVerifyKorapayPayment,
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

  const existing = await db.select().from(school).where(eq(school.code, finalCode))
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
    const paymentReference = `SCH-PAY-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`
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

    // 3. Initialize Korapay charge via centralized service (NGN 30,000 + NGN 161.25 fee)
    const initRes = await serviceInitializeKorapayPayment({
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

    return {
      success: true,
      applicationId,
      schoolId,
      schoolCode,
      paymentReference: initRes.reference || paymentReference,
      checkoutUrl: initRes.checkoutUrl,
    }
  } catch (error: any) {
    return sanitizeServerError('registerSchoolAction', error, 'School registration application could not be initialized.')
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
      application: appRecord,
      schoolCode: schRecord?.code || null,
    }
  } catch (error: any) {
    return sanitizeServerError('getSchoolApplicationStatusAction', error, 'Unable to retrieve application status.')
  }
}

export async function confirmSchoolPaymentAction(paymentReference: string) {
  const requestId = randomUUID()
  try {
    const verification = await serviceVerifyKorapayPayment({
      reference: paymentReference,
      expectedAmount: 30161.25,
    })

    if (!verification.success) {
      return { success: false, error: verification.error || 'Payment status not confirmed by gateway.' }
    }

    const existingSchool = await db.select().from(school).where(eq(school.paymentReference, paymentReference))
    const rec = existingSchool[0]

    let appRecord: any = null
    if (rec) {
      await db.update(schoolRegistrationApplication)
        .set({ paymentStatus: 'SUCCESS', updatedAt: new Date() })
        .where(eq(schoolRegistrationApplication.schoolId, rec.id))

      appRecord = await db.query.schoolRegistrationApplication.findFirst({
        where: eq(schoolRegistrationApplication.schoolId, rec.id)
      })
    }

    return {
      success: true,
      school: rec || null,
      schoolCode: rec?.code || verification.schoolCode,
      schoolName: rec?.name || verification.schoolName,
      adminEmail: rec?.adminEmail,
      adminName: rec?.adminName,
      amount: 30161.25,
      paidAt: new Date().toISOString(),
      applicationId: appRecord?.id || null,
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
    return sanitizeServerError('getSchoolByCodeAction', error, 'Unable to verify school code.')
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
    const sch = await db.query.school.findFirst({
      where: eq(school.id, schoolId)
    })

    if (!sch) throw new Error('School not found.')

    const paymentReference = `SCH-RNW-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`

    const initRes = await serviceInitializeKorapayPayment({
      schoolId: sch.id,
      amount: 30161.25,
      currency: 'NGN',
      feeType: 'SCHOOL_REGISTRATION_RENEWAL',
      description: `Bi-monthly School Registration Renewal for ${sch.name}`,
      customerEmail: sch.adminEmail,
      customerName: sch.adminName,
      redirectUrl: `${(process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/dashboard/admin/overview?renewal_reference=${encodeURIComponent(paymentReference)}`,
      metadata: {
        schoolId: sch.id,
        schoolCode: sch.code,
        paymentType: 'SCHOOL_REGISTRATION_RENEWAL',
      },
    })

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
    const verification = await serviceVerifyKorapayPayment({
      reference: paymentReference,
      expectedAmount: 30161.25,
    })

    if (!verification.success) {
      return { success: false, error: verification.error || 'Renewal payment verification failed.' }
    }

    const metadata = (verification.data as any)?.metadata || {}
    const schoolId = metadata.schoolId

    if (!schoolId) {
      return { success: false, error: 'School ID missing from payment metadata.' }
    }

    const now = new Date()
    const nextDueDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

    await db.update(school).set({
      paymentStatus: 'PAID',
      registrationPaidAt: now,
      registrationDueDate: nextDueDate,
      updatedAt: now,
    }).where(eq(school.id, schoolId))

    const { transactionLedger } = await import('@/lib/db/schema')
    await db.insert(transactionLedger).values({
      id: randomUUID(),
      schoolId: schoolId,
      type: 'REGISTRATION_FEE',
      direction: 'IN',
      amount: '30161.25',
      currency: 'NGN',
      reference: paymentReference,
      gateway: 'KORAPAY',
      status: 'SUCCESS',
      description: 'Bi-monthly School Registration Renewal Fee Payment',
      confirmationMethod: 'KORAPAY_AUTO',
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing()

    return { success: true, schoolId, nextDueDate: nextDueDate.toISOString() }
  } catch (error: any) {
    return sanitizeServerError('confirmSchoolRenewalPaymentAction', error, 'School renewal confirmation failed.')
  }
}
