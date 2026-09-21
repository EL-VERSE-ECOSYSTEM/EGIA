'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, parent as parentTable, userRole as userRoleTable, school as schoolTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { sanitizeServerError } from '@/lib/errors'

export const parentSignupSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').max(80),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').max(80),
  email: z.string().trim().email('Invalid email address').transform(v => v.toLowerCase()),
  phone: z.string().trim().min(7, 'Phone number must be at least 7 characters').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  schoolCode: z.string().trim().optional().nullable(),
})

export async function signUpAsParent(formData: unknown) {
  const parsed = parentSignupSchema.safeParse(formData)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
    return { success: false, error: errorMsg }
  }

  const { firstName, lastName, email, phone, password, schoolCode } = parsed.data
  const fullName = `${firstName} ${lastName}`

  let verifiedSchoolId: string | null = null
  if (schoolCode) {
    const matchingSchool = await db.query.school.findFirst({
      where: eq(schoolTable.code, schoolCode.toUpperCase()),
    })
    if (matchingSchool) {
      verifiedSchoolId = matchingSchool.id
    }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 1. Sign up to Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'PARENT',
      },
    },
  })

  if (authError || !authData.user) {
    return { success: false, error: 'User account creation failed. Please check your credentials and try again.' }
  }

  const userId = authData.user.id

  try {
    // 2. Create user record in application DB
    await db.insert(userTable).values({
      id: userId,
      email,
      name: fullName,
      schoolId: verifiedSchoolId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing()

    // 3. Create parent profile
    const parentId = randomUUID()
    await db.insert(parentTable).values({
      id: parentId,
      userId,
      schoolId: verifiedSchoolId,
      firstName,
      lastName,
      phoneNumber: phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).onConflictDoNothing()

    // 4. Assign PARENT user role
    await db.insert(userRoleTable).values({
      id: randomUUID(),
      userId,
      role: 'PARENT',
    }).onConflictDoNothing()

    return {
      success: true,
      userId,
      parentId,
    }
  } catch (dbError: any) {
    return sanitizeServerError('signUpAsParent DB creation', dbError, 'Failed to complete parent registration profile. Please try again.')
  }
}
