'use server'

import { db } from '@/lib/db'
import { school, user, userRole } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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
  const clean = schoolName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const prefix = clean.length >= 4 ? clean.slice(0, 4) : (clean + 'SCHO').slice(0, 4)

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
    const totalAmount = 30000 + 161.25

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

    // Insert user and role in real-time Supabase Database
    await db.insert(user).values({
      id: userId,
      email: adminEmail,
      name: input.adminName,
      schoolId: schoolId,
      password: adminPassword,
    }).onConflictDoNothing()

    await db.insert(userRole).values({
      id: randomUUID(),
      userId: userId,
      role: 'ADMIN',
    }).onConflictDoNothing()

    // Assign PRIMARY_ADMIN level to registering administrator
    const { schoolAdminRoles } = await import('@/lib/db/schema')
    await db.insert(schoolAdminRoles).values({
      id: randomUUID(),
      schoolId: schoolId,
      userId: userId,
      level: 'PRIMARY_ADMIN',
      department: null,
      isActive: true,
    }).onConflictDoNothing()

    const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://goodnews-app-mu.vercel.app/'
    const secretKey = process.env.KORAPAY_SECRET_KEY

    let checkoutUrl = `${process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW'}?reference=${encodeURIComponent(paymentReference)}&amount=${totalAmount}&customer_email=${encodeURIComponent(adminEmail)}`

    if (secretKey) {
      try {
        const payload = {
          amount: totalAmount,
          currency: 'NGN',
          reference: paymentReference,
          narration: `School Registration - ${input.name} (includes NGN 161.25 gateway fee)`,
          notification_url: `${siteUrl.replace(/\/$/, '')}/api/webhooks/korapay`,
          redirect_url: `${siteUrl.replace(/\/$/, '')}/api/payments/callback`,
          customer: {
            email: adminEmail,
            name: input.adminName,
          },
          metadata: {
            schoolId,
            schoolCode,
            type: 'SCHOOL_REGISTRATION',
          },
        }

        const koraRes = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (koraRes.ok) {
          const koraData = await koraRes.json()
          if (koraData.status && koraData.data?.checkout_url) {
            checkoutUrl = koraData.data.checkout_url
          }
        }
      } catch (e) {
        console.warn('Failed to call Korapay initialize charge API, falling back to hosted checkout url:', e)
      }
    }

    return {
      success: true,
      schoolId,
      schoolCode,
      paymentReference,
      amount: totalAmount,
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
    const result = await db.select().from(school).where(eq(school.code, cleanCode))
    if (!result.length) {
      return { success: false, error: 'Invalid School Code' }
    }
    return { success: true, school: result[0] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
