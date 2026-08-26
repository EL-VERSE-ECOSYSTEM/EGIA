'use server'

import { db } from '@/lib/db'
import { school, user, userRole } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/utils/supabase/config'
import { randomUUID } from 'crypto'

export interface SchoolRegistrationInput {
  name: string
  location: string
  registeredClasses: string[]
  allowParents: boolean
  adminName: string
  adminPhone: string
  adminEmail: string
  adminPassword?: string
}

function authAdminClient() {
  const secretKey = getSupabaseSecretKey()
  if (!secretKey) return null

  return createSupabaseAdminClient(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function generateSchoolCode(schoolName: string): Promise<string> {
  // Extract words and build 4-letter prefix from initials or clean school name
  const words = schoolName.trim().split(/\s+/).filter(w => w.length > 0)
  let prefix = ''

  if (words.length >= 4) {
    prefix = words.slice(0, 4).map(w => w[0]).join('').toUpperCase()
  } else if (words.length === 2 || words.length === 3) {
    prefix = words.map(w => w.slice(0, 2)).join('').slice(0, 4).toUpperCase()
  } else {
    const cleanName = schoolName.replace(/[^a-zA-Z]/g, '').toUpperCase()
    prefix = (cleanName + 'SCHO').slice(0, 4)
  }

  let isUnique = false
  let finalCode = ''

  while (!isUnique) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000).toString()
    finalCode = `${prefix}-${randomDigits}`

    const existing = await db.select({ id: school.id }).from(school).where(eq(school.code, finalCode))
    if (existing.length === 0) {
      isUnique = true
    }
  }

  return finalCode
}

export async function registerSchoolAction(input: SchoolRegistrationInput) {
  try {
    const schoolId = randomUUID()
    const schoolCode = await generateSchoolCode(input.name)
    const paymentReference = `SCH_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Insert school record in PENDING state awaiting Korapay payment checkout
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
    })

    const adminEmail = input.adminEmail.trim().toLowerCase()
    const adminPassword = input.adminPassword || 'AdminPass123!'
    const userId = randomUUID()

    // Provision admin in Supabase Auth
    const adminClient = authAdminClient()
    if (adminClient) {
      try {
        await adminClient.auth.admin.createUser({
          id: userId,
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            full_name: input.adminName,
            role: 'ADMIN',
            school_code: schoolCode,
          }
        })
      } catch (err) {
        console.warn('Could not create admin auth user:', err)
      }
    }

    // Insert user and role
    await db.insert(user).values({
      id: userId,
      email: adminEmail,
      name: input.adminName,
      schoolId: schoolId,
    }).onConflictDoNothing()

    await db.insert(userRole).values({
      id: randomUUID(),
      userId: userId,
      role: 'ADMIN',
    }).onConflictDoNothing()

    const checkoutBaseUrl = process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW'
    const checkoutUrl = `${checkoutBaseUrl}?reference=${encodeURIComponent(paymentReference)}&amount=30000&customer_email=${encodeURIComponent(adminEmail)}`

    return {
      success: true,
      schoolId,
      schoolCode,
      paymentReference,
      amount: 30000,
      adminEmail,
      adminName: input.adminName,
      schoolName: input.name,
      checkoutUrl
    }
  } catch (error: any) {
    console.error('Failed to register school:', error)
    return { success: false, error: error.message || 'Failed to initialize school registration' }
  }
}

export async function confirmSchoolPaymentAction(paymentReference: string) {
  try {
    const existingSchool = await db.select().from(school).where(eq(school.paymentReference, paymentReference))

    if (!existingSchool.length) {
      return { success: false, error: 'School registration record not found' }
    }

    const rec = existingSchool[0]

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
      amount: 30000,
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
    const result = await db.select().from(school).where(eq(school.code, cleanCode))
    if (!result.length) {
      return { success: false, error: 'Invalid School Code' }
    }
    return { success: true, school: result[0] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
