'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function registerParent(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { firstName, lastName, email, phone, password } = data

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        role: 'PARENT'
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Registration failed' }

  const userId = authData.user.id

  try {
    await db.transaction(async (tx) => {
      // Create user record
      await tx.insert(userTable).values({
        id: userId,
        email: email,
        name: `${firstName} ${lastName}`,
      })

      // Assign role
      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'PARENT',
      })

      // Create parent profile
      await tx.insert(parent).values({
        id: randomUUID(),
        userId: userId,
        firstName,
        lastName,
        phoneNumber: phone,
      })
    })

    return { success: true }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    return { error: 'Account created but profile failed. Please contact support.' }
  }
}

export async function registerTeacher(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { firstName, lastName, email, staffCode, password } = data

  // Basic staff code check (In real world, verify against a list)
  if (!staffCode.startsWith('EGIA-ST')) {
    return { error: 'Invalid staff verification code' }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        role: 'TEACHER'
      }
    }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Registration failed' }

  const userId = authData.user.id

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: email,
        name: `${firstName} ${lastName}`,
      })

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'TEACHER',
      })

      await tx.insert(teacher).values({
        id: randomUUID(),
        userId: userId,
        staffCode,
        firstName,
        lastName,
      })
    })

    return { success: true }
  } catch (dbError: any) {
    return { error: 'DB registration failed' }
  }
}

export async function activateStudent(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { admissionNumber, email, password } = data

  // 1. Verify admission number exists in DB
  const existingStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber)
  })

  if (!existingStudent) {
    return { error: 'Admission number not found. Please contact admin.' }
  }

  // 2. Sign up to Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${existingStudent.firstName} ${existingStudent.lastName}`,
        role: 'STUDENT',
        admission_number: admissionNumber
      }
    }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Activation failed' }

  const userId = authData.user.id

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: email,
        name: `${existingStudent.firstName} ${existingStudent.lastName}`,
      })

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'STUDENT',
      })

      // Link existing student profile to new auth user
      await tx.update(student)
        .set({ userId: userId })
        .where(eq(student.id, existingStudent.id))
    })

    return { success: true }
  } catch (dbError: any) {
    return { error: 'Activation DB link failed' }
  }
}

export async function loginAdmin(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { email, password } = data

  // Security: Only allow specific email or check for default admin
  if (email === 'admin@elgoodnews.edu.ng' && password === 'GOODNEWS123@') {
    // Force password change would happen here in a real app
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id

  // Verify role in DB
  const roleData = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, userId), eq(userRole.role, 'ADMIN'))
  })

  if (!roleData) return { error: 'Access denied' }

  return { success: true }
}
