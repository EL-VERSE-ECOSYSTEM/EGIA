'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function registerStudent(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    firstName,
    middleName,
    lastName,
    email,
    class: studentClass,
    dateOfBirth,
    dateOfResumption,
    subjectsDone,
    profileImage,
    password
  } = data

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  // Generate unique 6-digit admission number
  const admissionNumber = `GOD${Math.floor(100000 + Math.random() * 900000)}`

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        role: 'STUDENT',
        admission_number: admissionNumber
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
        image: profileImage || null
      })

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'STUDENT',
      })

      await tx.insert(student).values({
        id: randomUUID(),
        userId: userId,
        firstName,
        middleName: middleName || null,
        lastName,
        class: studentClass,
        admissionNumber,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        dateOfResumption: dateOfResumption ? dateOfResumption : null,
        subjectsDone: subjectsDone || null,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null
      })
    })

    return { success: true, admissionNumber }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    return { error: 'Account created but student profile failed. Please contact support.' }
  }
}

export async function registerParent(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { firstName, lastName, email, phone, occupation, profileImage, password } = data

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

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
      await tx.insert(userTable).values({
        id: userId,
        email: email,
        name: `${firstName} ${lastName}`,
        image: profileImage || null
      })

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'PARENT',
      })

      await tx.insert(parent).values({
        id: randomUUID(),
        userId: userId,
        firstName,
        lastName,
        phoneNumber: phone,
        occupation: occupation || null,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null
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
  const { firstName, lastName, email, profileImage, password } = data

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  // Generate dynamic unique 6-digit Staff ID
  const staffCode = `EGIA-ST-${Math.floor(100000 + Math.random() * 900000)}`

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        role: 'TEACHER',
        staff_code: staffCode
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
        image: profileImage || null
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
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null
      })
    })

    return { success: true, staffCode }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    return { error: 'DB registration failed' }
  }
}

export async function activateStudent(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { admissionNumber, email, password } = data

  const existingStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber)
  })

  if (!existingStudent) {
    return { error: 'Admission number not found. Please contact admin.' }
  }

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

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

  // Requirement: Master Admin Credentials Check
  if (email === 'admin@egia.com' && password === 'GOODNEWS20@') {
    // This part assumes the user already exists in Supabase Auth or we bypass it for dev
    // In production, the master admin should be a pre-created account.
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id

  const roleData = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, userId), eq(userRole.role, 'ADMIN'))
  })

  if (!roleData) return { error: 'Access denied' }

  return { success: true }
}
