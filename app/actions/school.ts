'use server'

import { db } from '@/lib/db'
import { school, schoolRegistrationApplication } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
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
  adminGender?: string
  adminLevel?: string
  logoUrl?: string
  logoPath?: string
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
  const requestId = randomUUID()
  try {
    if (!input.name || !input.adminEmail || !input.adminName) {
      return { success: false, error: 'School name, admin email, and admin name are required.' }
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

    // 2. Create PENDING School Registration Application
    // Untrusted applicant registration: NO SCHOOL_ADMIN account, userRole, or Auth user created at this stage.
    await db.insert(schoolRegistrationApplication).values({
      id: applicationId,
      schoolId: schoolId,
      applicantEmail: adminEmail,
      applicantPhone: input.adminPhone,
      applicantName: input.adminName,
      applicantGender: input.adminGender || null,
      adminLevel: input.adminLevel || 'PRIMARY_ADMIN',
      schoolName: input.name,
      schoolAddress: input.location,
      registeredClasses: input.registeredClasses,
      allowParents: input.allowParents,
      logoUrl: input.logoUrl || null,
      logoPath: input.logoPath || null,
      paymentStatus: 'PENDING',
      documentVerificationStatus: 'PENDING',
      approvalStatus: 'PENDING_REVIEW',
      submittedAt: new Date(),
    })

    // 3. Initialize Korapay subscription payment (NGN 30,000 + NGN 161.25 fee)
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
    console.error('Failed to register school application:', { requestId, error: error?.message || error })
    return { success: false, error: 'School registration application could not be initialized. Please verify your details and try again.', requestId }
  }
}

export async function uploadSchoolApplicationDocumentAction(input: {
  applicationId: string
  proofOfAddressType: string
  proofOfAddressFileUrl: string
  proofOfAddressFilePath?: string
  additionalDocuments?: any
}) {
  const requestId = randomUUID()
  try {
    if (!input.applicationId || !input.proofOfAddressFileUrl) {
      return { success: false, error: 'Application ID and Proof of Address file are required.' }
    }

    const appRecord = await db.query.schoolRegistrationApplication.findFirst({
      where: eq(schoolRegistrationApplication.id, input.applicationId)
    })

    if (!appRecord) {
      return { success: false, error: 'School registration application not found.' }
    }

    await db.update(schoolRegistrationApplication).set({
      proofOfAddressType: input.proofOfAddressType || 'ELECTRICITY_BILL',
      proofOfAddressFileUrl: input.proofOfAddressFileUrl,
      proofOfAddressFilePath: input.proofOfAddressFilePath || null,
      additionalDocuments: input.additionalDocuments || appRecord.additionalDocuments || null,
      documentVerificationStatus: 'PENDING', // Pending manual Super-Admin review
      updatedAt: new Date(),
    }).where(eq(schoolRegistrationApplication.id, input.applicationId))

    return { success: true, message: 'Document submitted successfully for Super-Admin review.' }
  } catch (error: any) {
    console.error('Failed to upload application document:', { requestId, error: error?.message || error })
    return { success: false, error: 'Document upload failed. Please try again.', requestId }
  }
}

export async function getSchoolApplicationStatusAction(applicationId: string) {
  const requestId = randomUUID()
  try {
    if (!applicationId) return { success: false, error: 'Application ID is required.' }

    const appRecord = await db.query.schoolRegistrationApplication.findFirst({
      where: eq(schoolRegistrationApplication.id, applicationId)
    })

    if (!appRecord) {
      return { success: false, error: 'Application not found.' }
    }

    const schRecord = await db.query.school.findFirst({
      where: eq(school.id, appRecord.schoolId)
    })

    return {
      success: true,
      application: appRecord,
      schoolCode: schRecord?.code || null,
    }
  } catch (error: any) {
    console.error('Failed to get school application status:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to retrieve application status.', requestId }
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
    console.error('Failed to confirm school payment:', { requestId, error: error?.message || error })
    return { success: false, error: 'School registration payment confirmation failed. Please try again.', requestId }
  }
}

export async function getSchoolByCodeAction(code: string) {
  const requestId = randomUUID()
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
    console.error('School lookup failed:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to verify school code. Please try again.', requestId }
  }
}
