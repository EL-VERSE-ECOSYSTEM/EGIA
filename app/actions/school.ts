'use server'

import { db } from '@/lib/db'
import { school, user as userTable, schoolAdminRoles, userRole } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'

export interface SchoolRegistrationInput {
  name: string
  location: string
  registeredClasses: any
  allowParents: boolean
  adminName: string
  adminPhone: string
  adminEmail: string
  adminPassword?: string
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
  const finalCode = `${prefix}${uniqueDigits}`

  const existing = await db.select().from(school).where(eq(school.code, finalCode))
  if (existing.length > 0) {
    return generateSchoolCode(schoolName)
  }

  return finalCode
}

export async function registerSchoolAction(input: SchoolRegistrationInput) {
  try {
    if (!input.name || !input.adminEmail || !input.adminName) {
      return { success: false, error: 'School name, admin email, and admin name are required.' }
    }

    const schoolId = randomUUID()
    const schoolCode = await generateSchoolCode(input.name)
    const paymentReference = `SCH_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    await db.insert(school).values({
      id: schoolId,
      name: input.name,
      code: schoolCode,
      location: input.location,
      registeredClasses: input.registeredClasses,
      allowParents: input.allowParents,
      adminName: input.adminName,
      adminPhone: input.adminPhone,
      adminEmail: input.adminEmail,
      paymentStatus: 'PENDING',
      paymentReference: paymentReference,
      logoUrl: input.logoUrl || null,
      logoPath: input.logoPath || null,
      logoUploadedAt: input.logoUrl ? new Date() : null,
    })

    const adminEmail = input.adminEmail.trim().toLowerCase()
    const adminPassword = input.adminPassword || 'AdminPass123!'
    const userId = randomUUID()

    let finalUserId: string = userId
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (secretKey) {
      const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
      const adminClient = createSupabaseAdminClient(supabaseUrl, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const createRes = await adminClient.auth.admin.createUser({
        id: userId,
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: input.adminName,
          role: 'ADMIN',
          school_code: schoolCode,
          school_id: schoolId,
        }
      })

      if (createRes.data?.user?.id) {
        finalUserId = createRes.data.user.id
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: finalUserId,
        email: adminEmail,
        name: input.adminName,
        schoolId: schoolId,
        adminLevel: input.adminLevel || 'PRIMARY_ADMIN',
        lastIdentityId: schoolId,
        lastIdentityAt: new Date(),
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: finalUserId,
        role: 'SCHOOL_ADMIN',
      }).onConflictDoNothing()

      await tx.insert(schoolAdminRoles).values({
        id: randomUUID(),
        schoolId: schoolId,
        userId: finalUserId,
        level: input.adminLevel || 'PRIMARY_ADMIN',
        isActive: true,
      }).onConflictDoNothing()
    })

    return {
      success: true,
      schoolId,
      schoolCode,
      paymentReference,
      checkoutUrl: `/payment/return?reference=${encodeURIComponent(paymentReference)}`
    }
  } catch (error: any) {
    console.error('Failed to register school:', error)
    return { success: false, error: error.message || 'Failed to initialize school registration' }
  }
}

export async function confirmSchoolPaymentAction(paymentReference: string) {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized session.' }
    }

    const existingSchool = await db.select().from(school).where(eq(school.paymentReference, paymentReference))

    if (!existingSchool.length) {
      return { success: false, error: 'School registration record not found' }
    }

    const rec = existingSchool[0]

    const secretKey = process.env.KORAPAY_SECRET_KEY
    if (secretKey) {
      const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(paymentReference)}`, {
        headers: { Authorization: `Bearer ${secretKey}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.status && data.data?.status !== 'success') {
          return { success: false, error: 'Payment status not confirmed by gateway.' }
        }
      }
    }

    await db.update(school)
      .set({ paymentStatus: 'PAID', updatedAt: new Date() })
      .where(eq(school.id, rec.id))

    return {
      success: true,
      school: rec,
      schoolCode: rec.code,
      schoolName: rec.name,
      adminEmail: rec.adminEmail,
      adminName: rec.adminName,
      amount: 30161.25,
      paidAt: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Failed to confirm school payment:', error)
    return { success: false, error: error.message || 'Payment confirmation failed' }
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
    return { success: false, error: error.message }
  }
}
