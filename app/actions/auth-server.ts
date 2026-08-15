'use server'

import { createClient } from '@/utils/supabase/server'
import { getSiteUrl, getSupabaseSecretKey, getSupabaseUrl, isSupabaseConfigured } from '@/utils/supabase/config'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student, payment, subject } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { generateAdmissionNumber, generateStaffId } from '@/lib/id'
import { createClient as createSupabaseAdminClient, type User as SupabaseUser } from '@supabase/supabase-js'
import { withCircuitBreaker } from '@/lib/resilience'

type AuthRole = 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function authAdminClient() {
  const secretKey = getSupabaseSecretKey()
  if (!secretKey) return null

  return createSupabaseAdminClient(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function isDuplicateSignup(user: SupabaseUser | null, error?: { message?: string } | null) {
  const message = error?.message?.toLowerCase() || ''
  return (
    message.includes('already registered') ||
    message.includes('already exists') ||
    (Array.isArray(user?.identities) && user.identities.length === 0)
  )
}

async function findAuthUserByEmail(adminClient: ReturnType<typeof authAdminClient>, email: string) {
  if (!adminClient) return null

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const found = data.users.find((user) => user.email?.toLowerCase() === email)
    if (found) return found
    if (data.users.length < 1000) return null
  }

  return null
}

async function provisionAuthUser(params: {
  email: string
  password: string
  role: AuthRole
  fullName: string
  metadata?: Record<string, unknown>
}) {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase authentication is not configured. Registration is unavailable until it is configured.' }
  }

  const email = normalizeEmail(params.email)
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const metadata = {
    ...params.metadata,
    full_name: params.fullName,
    role: params.role,
  }

  const adminClient = authAdminClient()
  if (adminClient) {
    try {
      const createResult = await withCircuitBreaker('supabase-auth-admin', () =>
        adminClient.auth.admin.createUser({
          email,
          password: params.password,
          email_confirm: true,
          user_metadata: metadata,
        }),
      )

      if (!createResult.error && createResult.data.user) {
        return { userId: createResult.data.user.id, email, created: true }
      }

      if (!isDuplicateSignup(null, createResult.error)) {
        return { error: createResult.error?.message || 'Could not create the Supabase account. Please try again.' }
      }

      const existingUser = await withCircuitBreaker('supabase-auth-admin', () => findAuthUserByEmail(adminClient, email))
      if (!existingUser) {
        return { error: 'A Supabase Auth account already exists, but it could not be loaded for profile linking.' }
      }

      const updateResult = await withCircuitBreaker('supabase-auth-admin', () =>
        adminClient.auth.admin.updateUserById(existingUser.id, {
          password: params.password,
          user_metadata: { ...existingUser.user_metadata, ...metadata },
        }),
      )

      if (updateResult.error) {
        return { error: updateResult.error.message }
      }

      return { userId: existingUser.id, email, created: false }
    } catch (error: any) {
      return { error: error?.message || 'Supabase authentication is temporarily unavailable.' }
    }
  }

  let signUpResult
  try {
    signUpResult = await withCircuitBreaker('supabase-auth', () =>
      supabase.auth.signUp({
        email,
        password: params.password,
        options: {
          data: metadata,
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      }),
    )
  } catch (error: any) {
    return { error: error?.message || 'Supabase authentication is temporarily unavailable.' }
  }

  if (!signUpResult.error && signUpResult.data.user && !isDuplicateSignup(signUpResult.data.user)) {
    return { userId: signUpResult.data.user.id, email, created: true }
  }

  if (!isDuplicateSignup(signUpResult.data.user, signUpResult.error)) {
    return { error: signUpResult.error?.message || 'Could not create the Supabase account. Please try again.' }
  }

  let signInResult
  try {
    signInResult = await withCircuitBreaker('supabase-auth', () =>
      supabase.auth.signInWithPassword({ email, password: params.password }),
    )
  } catch (error: any) {
    return { error: error?.message || 'Supabase authentication is temporarily unavailable.' }
  }

  if (signInResult.error || !signInResult.data.user) {
    return {
      error:
        'An account already exists in Supabase Auth, but this password could not verify it. Use the existing account password or contact support.',
    }
  }

  await supabase.auth.updateUser({ data: { ...signInResult.data.user.user_metadata, ...metadata } })
  return { userId: signInResult.data.user.id, email, created: false }
}

async function deleteAuthUserIfCreated(userId: string | null, created: boolean) {
  if (!userId || !created) return

  try {
    await authAdminClient()?.auth.admin.deleteUser(userId)
  } catch (error) {
    console.warn('Could not clean up Supabase Auth user after local DB failure.', error)
  }
}

/** Public catalogue used by session registration; names are persisted in student.subjectsdone. */
export async function getRegistrationSubjects() {
  return db.query.subject.findMany({ orderBy: (subject, { asc }) => [asc(subject.name)] })
}

export async function registerStudent(data: any) {
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
  const emailAddress = normalizeEmail(email)

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  // Generate unique 6-digit admission or pupil number
  const admissionNumber = generateAdmissionNumber(studentClass)

  const selectedSubjects = Array.isArray(subjectsDone) ? subjectsDone.map((item: unknown) => String(item).trim()).filter(Boolean) : []
  if (!selectedSubjects.length) return { error: 'Select at least one subject.' }
  if (selectedSubjects.some(item => item.length > 100)) return { error: 'Subject names must be 100 characters or fewer.' }

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password,
    role: 'STUDENT',
    fullName: `${firstName} ${lastName}`,
    metadata: { admission_number: admissionNumber },
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'STUDENT',
      }).onConflictDoNothing()

      await tx.insert(student).values({
        id: randomUUID(),
        userId: userId,
        firstName,
        middleName: middleName || null,
        lastName,
        class: studentClass,
        department: data.department || null,
        admissionNumber,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        dateOfResumption: dateOfResumption ? dateOfResumption : null,
        subjectsDone: selectedSubjects,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null,
        registrationStatus: 'PENDING_PAYMENT',
        password: password || 'default'
      })

      // Sync write to public.users table
      try {
        await tx.execute(sql`
          INSERT INTO public.users (id, email, full_name, role, is_active, is_verified, created_at, updated_at)
          VALUES (
            ${userId}::uuid,
            ${emailAddress},
            ${`${firstName} ${lastName}`},
            'STUDENT'::academy_user_role,
            true,
            true,
            NOW(),
            NOW()
          )
          ON CONFLICT (email) DO NOTHING
        `)
      } catch (err) {
        console.warn('Could not sync insert to public.users table:', err)
      }

      // Sync write to public.students table
      try {
        const pluralStudentId = randomUUID()
        await tx.execute(sql`
          INSERT INTO public.students (
            id, user_id, admission_number, first_name, last_name, middle_name,
            date_of_birth, gender, current_class, is_graduated, created_at, updated_at
          ) VALUES (
            ${pluralStudentId}::uuid,
            ${userId}::uuid,
            ${admissionNumber},
            ${firstName},
            ${lastName},
            ${middleName || null},
            ${dateOfBirth ? dateOfBirth : null}::date,
            ${data.gender || null},
            ${studentClass},
            false,
            NOW(),
            NOW()
          )
          ON CONFLICT (admission_number) DO NOTHING
        `)
      } catch (err) {
        console.warn('Could not sync insert to public.students table:', err)
      }
    })

    return { success: true, admissionNumber }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function registerParent(data: any) {
  const { firstName, lastName, email, phone, occupation, profileImage, password, wardAdmissionNumber } = data
  const emailAddress = normalizeEmail(email)

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password,
    role: 'PARENT',
    fullName: `${firstName} ${lastName}`,
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    const registration = await db.transaction(async (tx) => {
      const parentId = randomUUID()
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'PARENT',
      }).onConflictDoNothing()

      await tx.insert(parent).values({
        id: parentId,
        userId: userId,
        firstName,
        lastName,
        phoneNumber: phone,
        occupation: occupation || null,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null
      })

      // Sync write to public.users table
      try {
        await tx.execute(sql`
          INSERT INTO public.users (id, email, full_name, role, is_active, is_verified, created_at, updated_at)
          VALUES (
            ${userId}::uuid,
            ${emailAddress},
            ${`${firstName} ${lastName}`},
            'PARENT'::academy_user_role,
            true,
            true,
            NOW(),
            NOW()
          )
          ON CONFLICT (email) DO NOTHING
        `)
      } catch (err) {
        console.warn('Could not sync insert to public.users table:', err)
      }

      // Sync write to public.parents table
      try {
        await tx.execute(sql`
          INSERT INTO public.parents (
            id, user_id, occupation, created_at, updated_at
          ) VALUES (
            ${parentId}::uuid,
            ${userId}::uuid,
            ${occupation || null},
            NOW(),
            NOW()
          )
          ON CONFLICT DO NOTHING
        `)
      } catch (err) {
        console.warn('Could not sync insert to public.parents table:', err)
      }

      // Link multiple provided ward admission numbers (up to 5)
      const wardsList = Array.isArray(data.wardAdmissionNumbers)
        ? data.wardAdmissionNumbers
        : data.wardAdmissionNumber
        ? [data.wardAdmissionNumber]
        : []

      if (wardsList.length === 0) return null

      let firstReference = ''
      let firstPaymentId = ''

      for (const wardNum of wardsList) {
        const ward = await tx.query.student.findFirst({
          where: eq(student.admissionNumber, wardNum.trim().toUpperCase())
        })
        if (!ward) throw new Error(`Ward with admission number ${wardNum} was not found.`)
        if (ward.parentId && ward.parentId !== parentId) {
          // If already linked to another parent, just log warning and proceed to link to this parent
          console.warn(`Ward ${ward.firstName} was linked to another parent. Re-linking...`)
        }

        const reference = `EGIA-REG-${Date.now()}-${randomUUID().slice(0, 8)}`
        await tx.update(student).set({ parentId }).where(eq(student.id, ward.id))

        const createdPayment = (await tx.insert(payment).values({
          id: randomUUID(), studentId: ward.id, parentId, amount: '2000.00', feeType: 'registration',
          paymentMethod: 'KORAPAY', transactionReference: reference, status: 'pending',
          description: `Parent registration for ${ward.firstName} ${ward.lastName}`,
        }).returning())[0]

        if (!firstReference) {
          firstReference = reference
          firstPaymentId = createdPayment.id
        }
      }

      return { reference: firstReference, paymentId: firstPaymentId }
    })

    if (!registration) return { success: true }
    const url = new URL('https://checkout.korapay.com/pay/BHba4zdsceZDgyW')
    url.searchParams.set('reference', registration.reference)
    return { success: true, checkoutUrl: url.toString(), paymentId: registration.paymentId }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function registerTeacher(data: any) {
  const { firstName, lastName, email, profileImage, password } = data
  const emailAddress = normalizeEmail(email)

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  // Generate dynamic unique 6-digit Staff ID
  const staffCode = generateStaffId()

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password,
    role: 'TEACHER',
    fullName: `${firstName} ${lastName}`,
    metadata: { staff_code: staffCode },
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'TEACHER',
      }).onConflictDoNothing()

      await tx.insert(teacher).values({
        id: randomUUID(),
        userId: userId,
        staffCode,
        firstName,
        lastName,
        type: data.type || 'FULL_TIME',
        isPartTime: data.type === 'PART_TIME',
        handlingClasses: Array.isArray(data.handlingClasses) ? data.handlingClasses : [],
        teachingSubjects: Array.isArray(data.teachingSubjects) ? data.teachingSubjects : [],
        presentDays: Array.isArray(data.presentDays) ? data.presentDays : [],
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null
      })

      // Sync write to public.users table
      try {
        await tx.execute(sql`
          INSERT INTO public.users (id, email, full_name, role, is_active, is_verified, created_at, updated_at)
          VALUES (
            ${userId}::uuid,
            ${emailAddress},
            ${`${firstName} ${lastName}`},
            'TEACHER'::academy_user_role,
            true,
            true,
            NOW(),
            NOW()
          )
          ON CONFLICT (email) DO NOTHING
        `)
      } catch (err) {
        console.warn('Could not sync insert to public.users table:', err)
      }

      // Sync write to public.teachers table
      try {
        const pluralTeacherId = randomUUID()
        await tx.execute(sql`
          INSERT INTO public.teachers (
            id, user_id, staff_id, first_name, last_name, qualification, specialization, is_class_teacher, created_at, updated_at
          ) VALUES (
            ${pluralTeacherId}::uuid,
            ${userId}::uuid,
            ${staffCode},
            ${firstName},
            ${lastName},
            ${data.qualification || null},
            ${data.specialization || null},
            false,
            NOW(),
            NOW()
          )
          ON CONFLICT (staff_id) DO NOTHING
        `)
      } catch (err) {
        console.warn('Could not sync insert to public.teachers table:', err)
      }
    })

    return { success: true, staffCode }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function activateStudent(data: any) {
  const { admissionNumber, email, password } = data
  const emailAddress = normalizeEmail(email)

  const existingStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber.toUpperCase().trim())
  })

  if (!existingStudent) {
    return { error: 'Admission number not found. Please contact admin.' }
  }

  if (existingStudent.registrationStatus === 'PENDING_PAYMENT') {
    return { error: 'Your registration payment is still awaiting confirmation. Please complete the ₦2,000 Korapay checkout or contact support.' }
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const defaultStudentPassword = 'default'
  const authUser = await provisionAuthUser({
    email: emailAddress,
    password: defaultStudentPassword,
    role: 'STUDENT',
    fullName: `${existingStudent.firstName} ${existingStudent.lastName}`,
    metadata: { admission_number: admissionNumber.toUpperCase().trim() },
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create or verify the Supabase student account.' }
  if (existingStudent.userId && existingStudent.userId !== authUser.userId) {
    await deleteAuthUserIfCreated(authUser.userId, authUser.created === true)
    return { error: 'This admission number is already linked to another portal account.' }
  }

  const userId = authUser.userId

  try {
    await db.transaction(async (tx) => {
      const existingLocalUser = await tx.query.user.findFirst({
        where: eq(userTable.email, emailAddress)
      })

      if (!existingLocalUser) {
        await tx.insert(userTable).values({
          id: userId,
          email: emailAddress,
          name: `${existingStudent.firstName} ${existingStudent.lastName}`,
        })
      }

      const existingRole = await tx.query.userRole.findFirst({
        where: and(eq(userRole.userId, userId), eq(userRole.role, 'STUDENT'))
      })

      if (!existingRole) {
        await tx.insert(userRole).values({
          id: randomUUID(),
          userId: userId,
          role: 'STUDENT',
        })
      }

      await tx.update(student)
        .set({ userId: userId, password: password || 'default' })
        .where(eq(student.id, existingStudent.id))

      // Sync write to public.students table
      try {
        await tx.execute(sql`
          INSERT INTO public.students (
            id, user_id, admission_number, first_name, last_name, middle_name,
            date_of_birth, current_class, is_graduated, created_at, updated_at
          ) VALUES (
            ${existingStudent.id}::uuid,
            ${userId}::uuid,
            ${existingStudent.admissionNumber},
            ${existingStudent.firstName},
            ${existingStudent.lastName},
            ${existingStudent.middleName || null},
            ${existingStudent.dateOfBirth ? existingStudent.dateOfBirth : null}::date,
            ${existingStudent.class},
            false,
            NOW(),
            NOW()
          )
          ON CONFLICT (admission_number) DO NOTHING
        `)
      } catch (err) {
        console.warn('Could not sync insert to public.students table during activateStudent:', err)
      }

      if (existingStudent.parentId) {
        try {
          await tx.execute(sql`
            INSERT INTO public.parent_students (id, parent_id, student_id, is_guardian, relationship, created_at)
            VALUES (
              ${randomUUID()}::uuid,
              ${existingStudent.parentId}::uuid,
              ${existingStudent.id}::uuid,
              true,
              'PARENT',
              NOW()
            )
            ON CONFLICT DO NOTHING
          `)
        } catch (err) {
          console.warn('Could not sync insert to public.parent_students table during activateStudent:', err)
        }
      }
    })

    return { success: true }
  } catch (dbError: any) {
    console.error('Activation DB link failed:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Activation DB link failed' }
  }
}

export async function checkStudentPasswordRequirement(admissionNumber: string) {
  const cleanNumber = (admissionNumber || '').toString().toUpperCase().trim()
  if (!cleanNumber) return { requiresPassword: false }

  const existingStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, cleanNumber)
  })

  if (!existingStudent) return { requiresPassword: false }

  const hasCustomPassword = existingStudent.password && existingStudent.password !== 'default'
  return { requiresPassword: !!hasCustomPassword }
}

export async function loginStudent(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const admissionNumber = (data.admissionNumber || '').toString().toUpperCase().trim()
  const userPassword = data.password

  if (!admissionNumber) {
    return { error: 'Please provide a valid admission number.' }
  }

  const existingStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber)
  })

  if (!existingStudent) {
    return { error: 'Admission number not found. Please contact the school administration.' }
  }

  if (existingStudent.registrationStatus === 'PENDING_PAYMENT') {
    return { error: 'Your ₦2,000 registration payment is awaiting Korapay confirmation. Please complete checkout or contact support.' }
  }

  const hasCustomPassword = existingStudent.password && existingStudent.password !== 'default'
  if (hasCustomPassword && !userPassword) {
    return { error: 'Password is required for this account.' }
  }

  if (userPassword && existingStudent.password && userPassword !== existingStudent.password) {
    return { error: 'Invalid login credentials.' }
  }

  const loginPassword = userPassword || existingStudent.password || 'default'

  // Determine standard email address mapping dynamically from Supabase Database
  let resolvedEmail = `student.${admissionNumber.toLowerCase()}@portal.egia.local`
  if (existingStudent.userId) {
    const userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, existingStudent.userId)
    })
    if (userRecord?.email) {
      resolvedEmail = userRecord.email
    }
  }

  let realUserId = existingStudent.userId || null

  // Ensure remote Supabase Auth has this user and the password matches
  if (getSupabaseSecretKey()) {
    try {
      const adminClient = authAdminClient()
      if (adminClient) {
        // Attempt lookup by email first
        const existingAuthUser = await findAuthUserByEmail(adminClient, resolvedEmail)

        if (!existingAuthUser) {
          console.log(`[Auth] Creating remote Supabase Auth user for ${resolvedEmail}...`)
          const { data: created, error: createError } = await adminClient.auth.admin.createUser({
            id: existingStudent.userId || undefined,
            email: resolvedEmail,
            password: loginPassword,
            email_confirm: true,
            user_metadata: {
              full_name: `${existingStudent.firstName} ${existingStudent.lastName}`,
              role: 'STUDENT',
              admission_number: admissionNumber
            }
          })
          if (createError) throw createError
          if (created.user) {
            realUserId = created.user.id
          }
        } else {
          console.log(`[Auth] Syncing password for remote Supabase Auth user ${resolvedEmail}...`)
          const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
            password: loginPassword,
            user_metadata: {
              ...existingAuthUser.user_metadata,
              role: 'STUDENT',
              admission_number: admissionNumber
            }
          })
          if (updateError) throw updateError
          realUserId = existingAuthUser.id
        }

        // Self-heal and map actual remote user ID to all local PostgreSQL tables
        if (realUserId) {
          console.log(`[Auth] Self-healing and synchronizing database user ID to ${realUserId} for student ${admissionNumber}...`)
          await db.transaction(async (tx) => {
            // Ensure core user row exists
            const existingLocalUser = await tx.query.user.findFirst({
              where: eq(userTable.id, realUserId!)
            })
            if (!existingLocalUser) {
              await tx.insert(userTable).values({
                id: realUserId!,
                email: resolvedEmail,
                name: `${existingStudent.firstName} ${existingStudent.lastName}`
              }).onConflictDoNothing()
            }

            // Ensure student role row is bound
            await tx.insert(userRole).values({
              id: randomUUID(),
              userId: realUserId!,
              role: 'STUDENT'
            }).onConflictDoNothing()

            // Map student profile
            await tx.update(student)
              .set({ userId: realUserId!, password: loginPassword, updatedAt: new Date() })
              .where(eq(student.id, existingStudent.id))
          })
        }
      }
    } catch (err) {
      console.warn('[Auth] Mappings self-heal/sync failed during student login:', err)
    }
  }

  // Sign in using standard password client credentials
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: loginPassword
  })

  // Self-heal fallback: If login fails and student exists locally, attempt dynamic signup/creation
  if (authError) {
    console.log(`[Auth] Student login failed with error: ${authError.message}. Attempting self-healing signup for ${resolvedEmail}...`)
    try {
      // 1. Try with admin client if available
      const adminClient = authAdminClient()
      if (adminClient) {
        // Force create/update
        const existingAuthUser = await findAuthUserByEmail(adminClient, resolvedEmail)
        if (!existingAuthUser) {
          const { data: created, error: createError } = await adminClient.auth.admin.createUser({
            id: existingStudent.userId || undefined,
            email: resolvedEmail,
            password: loginPassword,
            email_confirm: true,
            user_metadata: {
              full_name: `${existingStudent.firstName} ${existingStudent.lastName}`,
              role: 'STUDENT',
              admission_number: admissionNumber
            }
          })
          if (!createError && created.user) {
            const retry = await supabase.auth.signInWithPassword({ email: resolvedEmail, password: loginPassword })
            if (!retry.error) {
              authError = null
              authData = retry.data
              realUserId = created.user.id
            }
          }
        } else {
          const { error: updateError } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
            password: loginPassword,
            user_metadata: {
              ...existingAuthUser.user_metadata,
              role: 'STUDENT',
              admission_number: admissionNumber
            }
          })
          if (!updateError) {
            const retry = await supabase.auth.signInWithPassword({ email: resolvedEmail, password: loginPassword })
            if (!retry.error) {
              authError = null
              authData = retry.data
              realUserId = existingAuthUser.id
            }
          }
        }
      }

      // 2. If admin client failed or wasn't used, try client signUp
      if (authError) {
        console.log(`[Auth] Standard signUp fallback for ${resolvedEmail}...`)
        const signUpResult = await supabase.auth.signUp({
          email: resolvedEmail,
          password: loginPassword,
          options: {
            data: {
              full_name: `${existingStudent.firstName} ${existingStudent.lastName}`,
              role: 'STUDENT',
              admission_number: admissionNumber
            }
          }
        })

        if (!signUpResult.error && signUpResult.data.user) {
          const retry = await supabase.auth.signInWithPassword({ email: resolvedEmail, password: loginPassword })
          if (!retry.error) {
            authError = null
            authData = retry.data
            realUserId = signUpResult.data.user.id
          }
        }
      }

      // 3. Sync ID mapped locally if self-healing succeeded
      if (!authError && realUserId) {
        await db.transaction(async (tx) => {
          const existingLocalUser = await tx.query.user.findFirst({
            where: eq(userTable.id, realUserId!)
          })
          if (!existingLocalUser) {
            await tx.insert(userTable).values({
              id: realUserId!,
              email: resolvedEmail,
              name: `${existingStudent.firstName} ${existingStudent.lastName}`
            }).onConflictDoNothing()
          }

          await tx.insert(userRole).values({
            id: randomUUID(),
            userId: realUserId!,
            role: 'STUDENT'
          }).onConflictDoNothing()

          await tx.update(student)
            .set({ userId: realUserId!, password: loginPassword, updatedAt: new Date() })
            .where(eq(student.id, existingStudent.id))

          // Sync write to public.students table
          try {
            await tx.execute(sql`
              INSERT INTO public.students (
                id, user_id, admission_number, first_name, last_name, middle_name,
                date_of_birth, current_class, is_graduated, created_at, updated_at
              ) VALUES (
                ${existingStudent.id}::uuid,
                ${realUserId}::uuid,
                ${existingStudent.admissionNumber},
                ${existingStudent.firstName},
                ${existingStudent.lastName},
                ${existingStudent.middleName || null},
                ${existingStudent.dateOfBirth ? existingStudent.dateOfBirth : null}::date,
                ${existingStudent.class},
                false,
                NOW(),
                NOW()
              )
              ON CONFLICT (admission_number) DO NOTHING
            `)
          } catch (err) {
            console.warn('Could not sync insert to public.students table during loginStudent self-healing:', err)
          }

          if (existingStudent.parentId) {
            try {
              await tx.execute(sql`
                INSERT INTO public.parent_students (id, parent_id, student_id, is_guardian, relationship, created_at)
                VALUES (
                  ${randomUUID()}::uuid,
                  ${existingStudent.parentId}::uuid,
                  ${existingStudent.id}::uuid,
                  true,
                  'PARENT',
                  NOW()
                )
                ON CONFLICT DO NOTHING
              `)
            } catch (err) {
              console.warn('Could not sync insert to public.parent_students table during loginStudent self-healing:', err)
            }
          }
        })
      }
    } catch (err) {
      console.warn('[Auth] Self-healing signup fallback failed:', err)
    }
  }

  if (authError) {
    return { error: authError.message }
  }

  return { success: true }
}

export async function loginRole(data: {
  identifier: string
  password: string
  role: Exclude<AuthRole, 'STUDENT'>
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const selectedRole = data.role?.toUpperCase() as Exclude<AuthRole, 'STUDENT'>
  const identifier = (data.identifier || '').trim()

  if (!identifier || !data.password) {
    return { error: 'Email or staff ID and password are required.' }
  }

  if (!['ADMIN', 'TEACHER', 'PARENT'].includes(selectedRole)) {
    return { error: 'Unsupported login role.' }
  }

  let email = normalizeEmail(identifier)

  if (selectedRole === 'TEACHER' && identifier.toUpperCase().startsWith('EGIA-ST')) {
    const teacherProfile = await db.query.teacher.findFirst({
      where: eq(teacher.staffCode, identifier.toUpperCase()),
      with: { user: true },
    })

    if (!teacherProfile?.user?.email) {
      return { error: `No staff found with Staff ID '${identifier.toUpperCase()}'.` }
    }

    email = normalizeEmail(teacherProfile.user.email)
  }

  let signInResult
  try {
    signInResult = await withCircuitBreaker('supabase-auth', () =>
      supabase.auth.signInWithPassword({ email, password: data.password }),
    )
  } catch (error: any) {
    return { error: error?.message || 'Supabase authentication is temporarily unavailable.' }
  }

  // Auto-provision or sync Parent/Teacher/Admin accounts in Supabase Auth if it exists on Postgres DB but not Auth
  if (signInResult.error && getSupabaseSecretKey()) {
    try {
      const adminClient = authAdminClient()
      if (adminClient) {
        const existingAuthUser = await findAuthUserByEmail(adminClient, email)
        const dbUser = await db.query.user.findFirst({
          where: eq(userTable.email, email)
        })
        if (dbUser) {
          if (!existingAuthUser) {
            console.log(`[Auth] Auto-provisioning seeded ${selectedRole} ${email} in Supabase...`)
            const { data: created, error: createError } = await adminClient.auth.admin.createUser({
              id: dbUser.id || undefined,
              email,
              password: data.password,
              email_confirm: true,
              user_metadata: {
                full_name: dbUser.name || 'User',
                role: selectedRole
              }
            })
            if (!createError && created.user) {
              signInResult = await supabase.auth.signInWithPassword({ email, password: data.password })
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not auto-provision/sync Parent/Teacher Supabase Auth record on login:', err)
    }
  }

  if (signInResult.error) return { error: signInResult.error.message }
  if (!signInResult.data.user) return { error: 'Sign-in failed. Please try again.' }

  const userId = signInResult.data.user.id
  const metadataRole = signInResult.data.user.user_metadata?.role?.toUpperCase()
  const roleData = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, userId), eq(userRole.role, selectedRole)),
  })

  if (!roleData && metadataRole !== selectedRole) {
    await supabase.auth.signOut()
    return { error: `Unauthorized: You do not have the registered role of '${selectedRole}' on this account.` }
  }

  return { success: true }
}

export async function loginAdmin(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { email, password } = data

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id
  if (authData.user.user_metadata?.role?.toUpperCase() === 'ADMIN') return { success: true }

  // Backwards-compatible fallback for legacy accounts whose role predates
  // Supabase Auth metadata. New accounts must carry the Auth role instead.
  const roleData = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, userId), eq(userRole.role, 'ADMIN'))
  })

  if (!roleData) {
    await supabase.auth.signOut()
    return { error: 'Access denied' }
  }

  return { success: true }
}

export async function registerParentTeacher(data: any) {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    occupation,
    // Combined Teacher Fields
    qualification,
    specialization,
    teacherType,
    handlingClasses,
    teachingSubjects,
    presentDays,
    // Combined Student/Child Fields
    childFirstName,
    childMiddleName,
    childLastName,
    childDOB,
    childResumptionDate,
    childGender,
    childClass,
    childDepartment,
    childSubjects,
    profileImage
  } = data
  const emailAddress = normalizeEmail(email)

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password,
    role: 'PARENT',
    fullName: `${firstName} ${lastName}`,
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    const parentId = randomUUID()
    const teacherId = randomUUID()
    const childStudentId = randomUUID()

    // DYNAMIC & SIMULTANEOUS ID GENERATION
    const admissionNumber = generateAdmissionNumber(childClass)
    const staffCode = generateStaffId()
    const registrationReference = `REG-${Date.now()}-${randomUUID().slice(0, 8)}`

    const selectedChildSubjects = Array.isArray(childSubjects) ? childSubjects : []

    await db.transaction(async (tx) => {
      // 1. Insert Parent / Teacher User Row
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null
      }).onConflictDoNothing()

      // 2. Insert User Role Rows (Primary PARENT role + TEACHER role)
      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'PARENT',
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'TEACHER',
      }).onConflictDoNothing()

      // 3. Insert Parent Profile Record
      await tx.insert(parent).values({
        id: parentId,
        userId: userId,
        firstName,
        lastName,
        phoneNumber: phone,
        occupation: occupation || 'Educator',
        profileImage: profileImage || null
      })

      // 4. Insert Teacher Profile Record with Staff ID
      await tx.insert(teacher).values({
        id: teacherId,
        userId: userId,
        staffCode,
        firstName,
        lastName,
        type: teacherType || 'FULL_TIME',
        qualification: qualification || null,
        specialization: specialization || null,
        handlingClasses: Array.isArray(handlingClasses) ? handlingClasses : [childClass],
        teachingSubjects: Array.isArray(teachingSubjects) ? teachingSubjects : [],
        presentDays: Array.isArray(presentDays) ? presentDays : [],
        profileImage: profileImage || null,
        status: 'APPROVED', // Pre-approved educator status
        isActive: true
      })

      // 5. Insert Child/Pupil Record with Admission Number
      await tx.insert(student).values({
        id: childStudentId,
        firstName: childFirstName,
        middleName: childMiddleName || null,
        lastName: childLastName,
        dateOfBirth: childDOB ? childDOB : null,
        dateOfResumption: childResumptionDate ? childResumptionDate : null,
        gender: childGender || null,
        class: childClass,
        department: childDepartment || null,
        subjectsDone: selectedChildSubjects,
        admissionNumber,
        parentId: parentId,
        password: 'default',
        isActive: true,
        registrationStatus: 'ACTIVE'
      })

      // 6. Pre-approved educator benefit payment record
      await tx.insert(payment).values({
        id: randomUUID(),
        studentId: childStudentId,
        parentId: parentId,
        amount: '2000.00',
        feeType: 'registration',
        paymentMethod: 'KORAPAY',
        transactionReference: registrationReference,
        status: 'success',
        paidAt: new Date(),
        paymentDate: new Date(),
        description: `Parent-Teacher Combined Registration for ${childFirstName} ${childLastName} (Admission No: ${admissionNumber}, Staff ID: ${staffCode})`,
        createdAt: new Date(),
        updatedAt: new Date()
      })

    })

    // Sync write to public.users table (executed outside main transaction to prevent rollback issues)
    try {
      await db.execute(sql`
        INSERT INTO public.users (id, email, full_name, role, is_active, is_verified, created_at, updated_at)
        VALUES (
          ${userId}::uuid,
          ${emailAddress},
          ${`${firstName} ${lastName}`},
          'PARENT'::academy_user_role,
          true,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `)
    } catch (err) {
      console.warn('Could not sync insert to public.users table in registerParentTeacher:', err)
    }

    // Sync write to public.parents table
    try {
      await db.execute(sql`
        INSERT INTO public.parents (
          id, user_id, created_at, updated_at
        ) VALUES (
          ${parentId}::uuid,
          ${userId}::uuid,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `)
    } catch (err) {
      console.warn('Could not sync insert to public.parents table in registerParentTeacher:', err)
    }

    // Sync write to public.teachers table
    try {
      await db.execute(sql`
        INSERT INTO public.teachers (
          id, user_id, staff_id, first_name, last_name, is_class_teacher, created_at, updated_at
        ) VALUES (
          ${teacherId}::uuid,
          ${userId}::uuid,
          ${staffCode},
          ${firstName},
          ${lastName},
          false,
          NOW(),
          NOW()
        )
        ON CONFLICT (staff_id) DO NOTHING
      `)
    } catch (err) {
      console.warn('Could not sync insert to public.teachers table in registerParentTeacher:', err)
    }

    const checkout = new URL(process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW')
    checkout.searchParams.set('reference', registrationReference)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl) checkout.searchParams.set('redirect_url', `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(registrationReference)}`)
    return { success: true, checkoutUrl: checkout.toString() }
  } catch (dbError: any) {
    console.error('DB Error in registerParentTeacher:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}
