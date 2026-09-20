'use server'

import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student, school } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) {
    throw new Error('Supabase admin credentials missing from environment.')
  }
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface VerifyForgotPasswordEmailResult {
  success: boolean
  error?: string
  verificationType?: 'PHONE' | 'SCHOOL_CODE'
  role?: string
  userId?: string
}

export async function verifyForgotPasswordEmailAction(emailInput: string): Promise<VerifyForgotPasswordEmailResult> {
  const email = emailInput.trim().toLowerCase()
  if (!email) {
    return { success: false, error: 'Please enter your registered email address.' }
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(userTable.email, email),
  })

  // Return generic response if email is not found to prevent account enumeration
  if (!userRecord) {
    return {
      success: true,
      verificationType: 'PHONE',
      role: 'PARENT',
      userId: 'generic-notice',
    }
  }

  const userRoles = await db.select().from(userRole).where(eq(userRole.userId, userRecord.id))
  const primaryRole = userRoles[0]?.role?.toUpperCase() || ''

  const isStudentRole = primaryRole === 'STUDENT' || primaryRole === 'PUPIL'
  const verificationType = isStudentRole ? 'SCHOOL_CODE' : 'PHONE'

  return {
    success: true,
    verificationType,
    role: primaryRole,
    userId: userRecord.id,
  }
}

export interface ConfirmForgotPasswordVerificationResult {
  success: boolean
  error?: string
}

export async function confirmForgotPasswordVerificationAction(
  userId: string,
  verificationType: 'PHONE' | 'SCHOOL_CODE',
  verificationInput: string
): Promise<ConfirmForgotPasswordVerificationResult> {
  const cleanInput = verificationInput.trim()
  if (!cleanInput) {
    return {
      success: false,
      error: verificationType === 'PHONE' ? 'Please enter the last 4 digits of your phone number.' : 'Please enter your school code.',
    }
  }

  if (userId === 'generic-notice') {
    return { success: false, error: 'Verification failed. Please check your information and try again.' }
  }

  if (verificationType === 'PHONE') {
    let registeredPhone = ''

    const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, userId) })
    if (userRecord?.schoolId) {
      const schoolRecord = await db.query.school.findFirst({ where: eq(school.id, userRecord.schoolId) })
      if (schoolRecord?.adminPhone) {
        registeredPhone = schoolRecord.adminPhone
      }
    }

    if (!registeredPhone) {
      const teacherRecord = await db.query.teacher.findFirst({ where: eq(teacher.userId, userId) })
      if (teacherRecord?.phoneNumber) {
        registeredPhone = teacherRecord.phoneNumber
      }
    }

    if (!registeredPhone) {
      const parentRecord = await db.query.parent.findFirst({ where: eq(parent.userId, userId) })
      if (parentRecord?.phoneNumber) {
        registeredPhone = parentRecord.phoneNumber
      }
    }

    if (!registeredPhone) {
      return { success: false, error: 'Verification failed. Please check your information and try again.' }
    }

    const digitsOnly = registeredPhone.replace(/\D/g, '')
    const lastFour = digitsOnly.slice(-4)

    if (cleanInput.replace(/\D/g, '') !== lastFour) {
      return { success: false, error: 'The digits entered do not match our records.' }
    }

    return { success: true }
  } else {
    const studentRecord = await db.query.student.findFirst({ where: eq(student.userId, userId) })
    let schoolId = studentRecord?.schoolId

    if (!schoolId) {
      const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, userId) })
      schoolId = userRecord?.schoolId || null
    }

    if (!schoolId) {
      return { success: false, error: 'Verification failed. Please check your information and try again.' }
    }

    const schoolRecord = await db.query.school.findFirst({ where: eq(school.id, schoolId) })
    if (!schoolRecord) {
      return { success: false, error: 'Verification failed. Please check your information and try again.' }
    }

    if (cleanInput.toUpperCase() !== schoolRecord.code.toUpperCase()) {
      return { success: false, error: 'Invalid school code.' }
    }

    return { success: true }
  }
}

export interface ResetForgotPasswordPasswordResult {
  success: boolean
  error?: string
}

export async function resetForgotPasswordPasswordAction(
  userId: string,
  newPassword: string
): Promise<ResetForgotPasswordPasswordResult> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters in length.' }
  }

  if (userId === 'generic-notice') {
    return { success: false, error: 'Password reset could not be completed.' }
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient()

    // Update password exclusively in Supabase Auth via Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (authError) {
      console.error('Supabase Auth password reset error:', authError)
      return { success: false, error: 'Password reset could not be completed with Auth provider.' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Real-time password reset failed:', err)
    return { success: false, error: 'Failed to update password.' }
  }
}
