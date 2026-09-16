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

  if (!userRecord) {
    return { success: false, error: 'No account found associated with this email address.' }
  }

  const userRoles = await db.select().from(userRole).where(eq(userRole.userId, userRecord.id))
  const primaryRole = userRoles[0]?.role?.toUpperCase() || ''

  // Determine verification type:
  // If role is STUDENT or PUPIL -> verification requires School Code
  // If role is SCHOOL_ADMIN, TEACHER, or PARENT -> verification requires last 4 digits of phone number
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

  if (verificationType === 'PHONE') {
    // Check across School, Teacher, Parent profile phone numbers
    let registeredPhone = ''

    // Check school admin
    const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, userId) })
    if (userRecord?.schoolId) {
      const schoolRecord = await db.query.school.findFirst({ where: eq(school.id, userRecord.schoolId) })
      if (schoolRecord?.adminPhone) {
        registeredPhone = schoolRecord.adminPhone
      }
    }

    // Check teacher profile
    if (!registeredPhone) {
      const teacherRecord = await db.query.teacher.findFirst({ where: eq(teacher.userId, userId) })
      if (teacherRecord?.phoneNumber) {
        registeredPhone = teacherRecord.phoneNumber
      }
    }

    // Check parent profile
    if (!registeredPhone) {
      const parentRecord = await db.query.parent.findFirst({ where: eq(parent.userId, userId) })
      if (parentRecord?.phoneNumber) {
        registeredPhone = parentRecord.phoneNumber
      }
    }

    if (!registeredPhone) {
      return { success: false, error: 'No phone number is registered for this account profile.' }
    }

    const digitsOnly = registeredPhone.replace(/\D/g, '')
    const lastFour = digitsOnly.slice(-4)

    if (cleanInput.replace(/\D/g, '') !== lastFour) {
      return { success: false, error: 'The digits entered do not match our records.' }
    }

    return { success: true }
  } else {
    // Verification via School Code
    const studentRecord = await db.query.student.findFirst({ where: eq(student.userId, userId) })
    let schoolId = studentRecord?.schoolId

    if (!schoolId) {
      const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, userId) })
      schoolId = userRecord?.schoolId || null
    }

    if (!schoolId) {
      return { success: false, error: 'No school tenant association found for this student account.' }
    }

    const schoolRecord = await db.query.school.findFirst({ where: eq(school.id, schoolId) })
    if (!schoolRecord) {
      return { success: false, error: 'Associated school record not found.' }
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
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters in length.' }
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient()

    // Update password in Supabase Auth via Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (authError) {
      console.warn('Supabase Auth password reset error:', authError)
    }

    // Update password in public.user database
    await db.update(userTable)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(userTable.id, userId))

    // Update password in role tables if applicable
    await db.update(student)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(student.userId, userId))

    await db.update(teacher)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(teacher.userId, userId))

    await db.update(parent)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(parent.userId, userId))

    return { success: true }
  } catch (err: any) {
    console.error('Real-time password reset failed:', err)
    return { success: false, error: err.message || 'Failed to update password.' }
  }
}
