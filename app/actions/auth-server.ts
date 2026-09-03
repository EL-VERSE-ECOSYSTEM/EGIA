'use server'

import { createClient } from '@/utils/supabase/server'
import { getSiteUrl, getSupabaseSecretKey, getSupabaseUrl, isSupabaseConfigured } from '@/utils/supabase/config'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student, payment, subject, school } from '@/lib/db/schema'
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

export async function checkStudentPasswordRequirement(admissionNumber: string) {
  const normalizedAdmission = (admissionNumber || '').trim().toUpperCase()
  if (!normalizedAdmission) return { requiresPassword: false }

  const foundStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, normalizedAdmission)
  })

  if (!foundStudent) return { requiresPassword: false, notFound: true }

  const hasCustomPassword = !!(foundStudent.password && foundStudent.password !== 'default')
  return { requiresPassword: hasCustomPassword }
}

export async function activateStudent(data: { admissionNumber: string; email: string }) {
  const { admissionNumber, email } = data
  const normalizedAdmission = (admissionNumber || '').trim().toUpperCase()
  const emailAddress = normalizeEmail(email)

  if (!normalizedAdmission || !emailAddress) {
    return { error: 'Admission number and email address are required.' }
  }

  const existingStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, normalizedAdmission)
  })

  if (!existingStudent) {
    return { error: `Student with admission number '${normalizedAdmission}' was not found.` }
  }

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password: existingStudent.password || 'default',
    role: 'STUDENT',
    fullName: `${existingStudent.firstName} ${existingStudent.lastName}`,
    metadata: { admission_number: normalizedAdmission, school_id: existingStudent.schoolId }
  })

  if (authUser.error || !authUser.userId) {
    return { error: authUser.error || 'Could not provision student account in Supabase.' }
  }

  const userId = authUser.userId

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${existingStudent.firstName} ${existingStudent.lastName}`,
        schoolId: existingStudent.schoolId
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId,
        role: 'STUDENT'
      }).onConflictDoNothing()

      await tx.update(student)
        .set({ userId, registrationStatus: 'REGISTERED', updatedAt: new Date() })
        .where(eq(student.id, existingStudent.id))
    })

    return { success: true }
  } catch (err: any) {
    console.error('Failed to activate student account:', err)
    return { error: 'Failed to update student account records.' }
  }
}

export async function registerParentTeacher(data: any) {
  const {
    firstName,
    lastName,
    email,
    phone,
    occupation,
    password,
    profileImage,
    schoolCode,
    qualification,
    specialization,
    teacherType,
    handlingClasses,
    teachingSubjects,
    childFirstName,
    childMiddleName,
    childLastName,
    childDOB,
    childResumptionDate,
    childGender,
    childClass,
    childDepartment,
    childSubjects,
  } = data

  const emailAddress = normalizeEmail(email)

  let schoolId: string | null = null
  let schoolName: string | null = null
  if (schoolCode) {
    const schoolRec = await db.query.school.findFirst({
      where: eq(school.code, schoolCode.trim().toUpperCase())
    })
    if (!schoolRec) {
      return { error: 'Invalid School Registration Code.' }
    }
    schoolId = schoolRec.id
    schoolName = schoolRec.name
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const staffCode = generateStaffId(schoolName || schoolCode)

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password,
    role: 'PARENT',
    fullName: `${firstName} ${lastName}`,
    metadata: { staff_code: staffCode, school_id: schoolId },
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    let parentId = randomUUID()
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null,
        schoolId
      }).onConflictDoNothing()

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

      await tx.insert(parent).values({
        id: parentId,
        userId: userId,
        schoolId,
        firstName,
        lastName,
        phoneNumber: phone,
        occupation: occupation || 'Educator',
        profileImage: profileImage || null
      })

      await tx.insert(teacher).values({
        id: randomUUID(),
        userId: userId,
        schoolId,
        staffCode,
        firstName,
        lastName,
        type: teacherType || 'FULL_TIME',
        handlingClasses: Array.isArray(handlingClasses) ? handlingClasses : [],
        teachingSubjects: Array.isArray(teachingSubjects) ? teachingSubjects : [],
        profileImage: profileImage || null
      })

      if (childFirstName && childLastName) {
        const admissionNumber = generateAdmissionNumber(childClass || 'Primary 3', schoolName || schoolCode)
        const childUserId = randomUUID()

        await tx.insert(userTable).values({
          id: childUserId,
          email: `student.${admissionNumber.toLowerCase()}@portal.egia.local`,
          name: `${childFirstName} ${childLastName}`,
          schoolId
        }).onConflictDoNothing()

        await tx.insert(userRole).values({
          id: randomUUID(),
          userId: childUserId,
          role: 'STUDENT'
        }).onConflictDoNothing()

        await tx.insert(student).values({
          id: randomUUID(),
          userId: childUserId,
          parentId: parentId,
          schoolId,
          firstName: childFirstName,
          middleName: childMiddleName || null,
          lastName: childLastName,
          class: childClass || 'Primary 3',
          department: childDepartment || null,
          admissionNumber,
          dateOfBirth: childDOB || null,
          dateOfResumption: childResumptionDate || null,
          subjectsDone: Array.isArray(childSubjects) ? childSubjects : [],
          registrationStatus: 'REGISTERED'
        })
      }
    })

    return { success: true, staffCode }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
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
    password,
    schoolCode
  } = data
  const emailAddress = normalizeEmail(email)

  let schoolId: string | null = null
  let schoolName: string | null = null
  if (schoolCode) {
    const schoolRec = await db.query.school.findFirst({
      where: eq(school.code, schoolCode.trim().toUpperCase())
    })
    if (!schoolRec) {
      return { error: 'Invalid School Registration Code.' }
    }
    schoolId = schoolRec.id
    schoolName = schoolRec.name
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const admissionNumber = generateAdmissionNumber(studentClass, schoolName || schoolCode)

  const selectedSubjects = Array.isArray(subjectsDone) ? subjectsDone.map((item: unknown) => String(item).trim()).filter(Boolean) : []
  if (!selectedSubjects.length) return { error: 'Select at least one subject.' }
  if (selectedSubjects.some(item => item.length > 100)) return { error: 'Subject names must be 100 characters or fewer.' }

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password,
    role: 'STUDENT',
    fullName: `${firstName} ${lastName}`,
    metadata: { admission_number: admissionNumber, school_id: schoolId },
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null,
        schoolId
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'STUDENT',
      }).onConflictDoNothing()

      await tx.insert(student).values({
        id: randomUUID(),
        userId: userId,
        schoolId,
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
    })

    return { success: true, admissionNumber }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function registerParent(data: any) {
  const { firstName, lastName, email, phone, occupation, profileImage, password, schoolCode } = data
  const emailAddress = normalizeEmail(email)

  let schoolId: string | null = null
  if (schoolCode) {
    const schoolRec = await db.query.school.findFirst({
      where: eq(school.code, schoolCode.trim().toUpperCase())
    })
    if (!schoolRec) {
      return { error: 'Invalid School Registration Code.' }
    }
    if (!schoolRec.allowParents) {
      return { error: 'Parent registration is disabled by this school administration.' }
    }
    schoolId = schoolRec.id
  }

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
    metadata: { school_id: schoolId }
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    await db.transaction(async (tx) => {
      const parentId = randomUUID()
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null,
        schoolId
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'PARENT',
      }).onConflictDoNothing()

      await tx.insert(parent).values({
        id: parentId,
        userId: userId,
        schoolId,
        firstName,
        lastName,
        phoneNumber: phone,
        occupation: occupation || null,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null
      })

      const wardsList = Array.isArray(data.wardAdmissionNumbers)
        ? data.wardAdmissionNumbers
        : data.wardAdmissionNumber
        ? [data.wardAdmissionNumber]
        : []

      for (const wardNum of wardsList) {
        const ward = await tx.query.student.findFirst({
          where: eq(student.admissionNumber, wardNum.trim().toUpperCase())
        })
        if (ward) {
          await tx.update(student).set({ parentId }).where(eq(student.id, ward.id))
        }
      }
    })

    return { success: true }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function registerTeacher(data: any) {
  const { firstName, lastName, email, profileImage, password, schoolCode } = data
  const emailAddress = normalizeEmail(email)

  let schoolId: string | null = null
  let schoolName: string | null = null
  if (schoolCode) {
    const schoolRec = await db.query.school.findFirst({
      where: eq(school.code, schoolCode.trim().toUpperCase())
    })
    if (!schoolRec) {
      return { error: 'Invalid School Registration Code.' }
    }
    schoolId = schoolRec.id
    schoolName = schoolRec.name
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, emailAddress)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const staffCode = generateStaffId(schoolName || schoolCode)

  const authUser = await provisionAuthUser({
    email: emailAddress,
    password,
    role: 'TEACHER',
    fullName: `${firstName} ${lastName}`,
    metadata: { staff_code: staffCode, school_id: schoolId },
  })
  if (authUser.error || !authUser.userId) return { error: authUser.error || 'Could not create the Supabase account. Please try again.' }

  const userId = authUser.userId

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email: emailAddress,
        name: `${firstName} ${lastName}`,
        image: profileImage || null,
        schoolId
      }).onConflictDoNothing()

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'TEACHER',
      }).onConflictDoNothing()

      await tx.insert(teacher).values({
        id: randomUUID(),
        userId: userId,
        schoolId,
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
    })

    return { success: true, staffCode }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
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

  const hasCustomPassword = existingStudent.password && existingStudent.password !== 'default'
  if (hasCustomPassword && !userPassword) {
    return { error: 'Password is required for this account.' }
  }

  if (userPassword && existingStudent.password && userPassword !== existingStudent.password) {
    return { error: 'Invalid login credentials.' }
  }

  const loginPassword = userPassword || existingStudent.password || 'default'

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

  if (getSupabaseSecretKey()) {
    try {
      const adminClient = authAdminClient()
      if (adminClient) {
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
            realUserId = created.user.id
          }
        } else {
          const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(existingAuthUser.id, {
            password: loginPassword,
            user_metadata: {
              ...existingAuthUser.user_metadata,
              role: 'STUDENT',
              admission_number: admissionNumber
            }
          })
          if (!updateError) realUserId = existingAuthUser.id
        }

        if (realUserId) {
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
          })
        }
      }
    } catch (err) {
      console.warn('[Auth] Mappings self-heal/sync failed during student login:', err)
    }
  }

  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: loginPassword
  })

  if (authError) {
    return { error: authError.message }
  }

  return { success: true }
}

export async function loginRole(data: {
  identifier: string
  password: string
  role: Exclude<AuthRole, 'STUDENT'> | 'SCHOOL_ADMIN' | 'SUPER_ADMIN'
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const selectedRole = data.role?.toUpperCase()
  const identifier = (data.identifier || '').trim()

  if (!identifier || !data.password) {
    return { error: 'Email or staff ID and password are required.' }
  }

  let email = normalizeEmail(identifier)

  if (selectedRole === 'TEACHER' && identifier.includes('-ST-')) {
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

  // Auto-provision or sync accounts in Supabase Auth if found locally
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
      console.warn('Could not auto-provision/sync Supabase Auth record on login:', err)
    }
  }

  if (signInResult.error) return { error: signInResult.error.message }
  if (!signInResult.data.user) return { error: 'Sign-in failed. Please try again.' }

  const userId = signInResult.data.user.id
  const metadataRole = signInResult.data.user.user_metadata?.role?.toUpperCase()

  // Strict role verification check against database roles & Supabase Auth metadata
  const targetRoleName = (selectedRole === 'SCHOOL_ADMIN' || selectedRole === 'SUPER_ADMIN') ? 'ADMIN' : selectedRole
  const roleData = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, userId), eq(userRole.role, targetRoleName)),
  })

  if (!roleData && metadataRole !== targetRoleName && metadataRole !== 'SCHOOL_ADMIN' && metadataRole !== 'SUPER_ADMIN') {
    await supabase.auth.signOut()
    return { error: `Unauthorized: Account does not have '${selectedRole}' permissions.` }
  }

  return { success: true }
}
