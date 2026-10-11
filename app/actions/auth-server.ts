'use server'

import { createClient } from '@/utils/supabase/server'
import { getSiteUrl, getSupabaseSecretKey, getSupabaseUrl, isSupabaseConfigured } from '@/utils/supabase/config'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student, payment, subject, school } from '@/lib/db/schema'
import { eq, and, or, sql, isNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { generateAdmissionNumber, generateStaffId } from '@/lib/id'
import { createClient as createSupabaseAdminClient, type User as SupabaseUser } from '@supabase/supabase-js'
import { withCircuitBreaker } from '@/lib/resilience'
import { isSuperAdminEmail, isSuperAdminUser } from '@/lib/auth/super-admin'

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
  return { requiresPassword: true }
}

export async function activateStudent(data: any) {
  return { error: 'Student activation requires verified school registration and a password. Use the Student / Pupil registration form.' }
}

export async function registerParentTeacher(data: any) {
  return registerTeacher(data)
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

  if (!schoolCode?.trim()) {
    return { error: 'School Registration Code is required.' }
  }

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
    return { error: 'An account with this email is already registered. Please sign in instead.' }
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
  let createdStudentId = randomUUID()

  try {
    await db.transaction(async (tx) => {
      const existingDbUser = await tx.query.user.findFirst({ where: eq(userTable.email, emailAddress) })
      let finalUserId = userId

      if (existingDbUser) {
        finalUserId = existingDbUser.id
        await tx.update(userTable).set({
          name: `${firstName} ${lastName}`,
          image: profileImage || existingDbUser.image,
          schoolId: schoolId || existingDbUser.schoolId,
          gender: data.gender || existingDbUser.gender || 'Male',
          lastIdentityId: createdStudentId,
          lastIdentityAt: new Date(),
          updatedAt: new Date()
        }).where(eq(userTable.id, finalUserId))
      } else {
        await tx.insert(userTable).values({
          id: userId,
          email: emailAddress,
          name: `${firstName} ${lastName}`,
          image: profileImage || null,
          schoolId,
          gender: data.gender || 'Male',
          lastIdentityId: createdStudentId,
          lastIdentityAt: new Date(),
        }).onConflictDoNothing()
      }

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: finalUserId,
        role: 'STUDENT',
      }).onConflictDoNothing()

      await tx.insert(student).values({
        id: createdStudentId,
        userId: finalUserId,
        schoolId,
        firstName,
        middleName: middleName || null,
        lastName,
        gender: data.gender || 'Male',
        class: studentClass,
        department: data.department || null,
        admissionNumber,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        dateOfResumption: dateOfResumption ? dateOfResumption : null,
        subjectsDone: selectedSubjects,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null,
        registrationStatus: 'PENDING_PAYMENT',
      })
    })

    return { success: true, admissionNumber, studentId: createdStudentId }
  } catch (dbError: any) {
    console.error('DB Error during student registration:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    const rawMsg = dbError?.message || ''
    const friendlyMsg = rawMsg.includes('unique') || rawMsg.includes('duplicate')
      ? 'A student with this admission number or details is already registered.'
      : 'Student registration failed. Please check your details and try again.'
    return { error: friendlyMsg }
  }
}

export async function registerParent(data: any) {
  const { firstName, lastName, email, phone, occupation, profileImage, password, schoolCode } = data
  const emailAddress = normalizeEmail(email)
  const wardsList: string[] = Array.isArray(data.wardAdmissionNumbers)
    ? [...new Set<string>(data.wardAdmissionNumbers.map((value: unknown): string => String(value).trim().toUpperCase()).filter(Boolean))]
    : data.wardAdmissionNumber
    ? [String(data.wardAdmissionNumber).trim().toUpperCase()]
    : []

  if (!schoolCode?.trim()) {
    return { error: 'A valid school registration code is required to link a ward.' }
  }
  if (!wardsList.length) {
    return { error: 'At least one ward admission number is required.' }
  }

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
    return { error: 'An account with this email is already registered. Please sign in instead.' }
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
      const existingDbUser = await tx.query.user.findFirst({ where: eq(userTable.email, emailAddress) })
      let finalUserId = userId

      const parentId = randomUUID()

      if (existingDbUser) {
        finalUserId = existingDbUser.id
        await tx.update(userTable).set({
          name: `${firstName} ${lastName}`,
          image: profileImage || existingDbUser.image,
          schoolId: schoolId || existingDbUser.schoolId,
          gender: data.gender || existingDbUser.gender || 'Male',
          lastIdentityId: parentId,
          lastIdentityAt: new Date(),
          updatedAt: new Date()
        }).where(eq(userTable.id, finalUserId))
      } else {
        await tx.insert(userTable).values({
          id: userId,
          email: emailAddress,
          name: `${firstName} ${lastName}`,
          image: profileImage || null,
          schoolId,
          gender: data.gender || 'Male',
          lastIdentityId: parentId,
          lastIdentityAt: new Date(),
        }).onConflictDoNothing()
      }

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: finalUserId,
        role: 'PARENT',
      }).onConflictDoNothing()

      await tx.insert(parent).values({
        id: parentId,
        userId: finalUserId,
        schoolId,
        firstName,
        lastName,
        gender: data.gender || 'Male',
        phoneNumber: phone,
        occupation: occupation || null,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null,
      })

      for (const wardNum of wardsList) {
        const normalizedWardNum = String(wardNum)
        const ward = await tx.query.student.findFirst({
          where: and(
            eq(student.admissionNumber, normalizedWardNum),
            eq(student.schoolId, schoolId!)
          )
        })
        if (!ward || ward.parentId) {
          throw new Error('Ward could not be linked. Verify that the admission number belongs to this school and is not already linked.')
        }

        const [linkedWard] = await tx.update(student)
          .set({ parentId })
          .where(and(eq(student.id, ward.id), eq(student.schoolId, schoolId!), isNull(student.parentId)))
          .returning({ id: student.id })
        if (!linkedWard) {
          throw new Error('Ward could not be linked. Verify that the admission number belongs to this school and is not already linked.')
        }
      }
    })

    return { success: true }
  } catch (dbError: any) {
    console.error('DB Error during parent registration:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    const rawMsg = dbError?.message || ''
    const friendlyMsg = rawMsg.includes('unique') || rawMsg.includes('duplicate')
      ? 'An account with these profile details already exists.'
      : 'Parent registration failed. Please check your details and try again.'
    return { error: friendlyMsg }
  }
}

export async function registerTeacher(data: any) {
  const { firstName, lastName, email, phone, phoneNumber, profileImage, password, schoolCode, isAlsoParent, wardAdmissionNumber } = data
  const emailAddress = normalizeEmail(email)
  const teacherPhone = phoneNumber || phone || null

  if (!schoolCode?.trim()) {
    return { error: 'School Registration Code is required.' }
  }

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
    return { error: 'An account with this email is already registered. Please sign in instead.' }
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
      const existingDbUser = await tx.query.user.findFirst({ where: eq(userTable.email, emailAddress) })
      let finalUserId = userId

      const teacherId = randomUUID()

      if (existingDbUser) {
        finalUserId = existingDbUser.id
        await tx.update(userTable).set({
          name: `${firstName} ${lastName}`,
          image: profileImage || existingDbUser.image,
          schoolId: schoolId || existingDbUser.schoolId,
          gender: data.gender || existingDbUser.gender || 'Male',
          lastIdentityId: teacherId,
          lastIdentityAt: new Date(),
          updatedAt: new Date()
        }).where(eq(userTable.id, finalUserId))
      } else {
        await tx.insert(userTable).values({
          id: userId,
          email: emailAddress,
          name: `${firstName} ${lastName}`,
          image: profileImage || null,
          schoolId,
          gender: data.gender || 'Male',
          lastIdentityId: teacherId,
          lastIdentityAt: new Date(),
        }).onConflictDoNothing()
      }

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: finalUserId,
        role: 'TEACHER',
      }).onConflictDoNothing()

      await tx.insert(teacher).values({
        id: randomUUID(),
        userId: finalUserId,
        schoolId,
        staffCode,
        firstName,
        lastName,
        phoneNumber: teacherPhone,
        gender: data.gender || 'Male',
        type: data.type || 'FULL_TIME',
        isPartTime: data.type === 'PART_TIME',
        handlingClasses: Array.isArray(data.handlingClasses) ? data.handlingClasses : [],
        teachingSubjects: Array.isArray(data.teachingSubjects) ? data.teachingSubjects : [],
        presentDays: Array.isArray(data.presentDays) ? data.presentDays : [],
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null,
      })

      // If teacher indicated they are also a Parent, seamlessly create Parent profile and link ward
      if (isAlsoParent) {
        const parentId = randomUUID()
        await tx.insert(userRole).values({
          id: randomUUID(),
          userId: finalUserId,
          role: 'PARENT',
        }).onConflictDoNothing()

        await tx.insert(parent).values({
          id: parentId,
          userId: finalUserId,
          schoolId,
          firstName,
          lastName,
          gender: data.gender || 'Male',
          phoneNumber: teacherPhone,
          profileImage: profileImage || null,
        }).onConflictDoNothing()

        if (wardAdmissionNumber) {
          const ward = await tx.query.student.findFirst({
            where: eq(student.admissionNumber, wardAdmissionNumber.trim().toUpperCase())
          })
          if (ward) {
            await tx.update(student).set({ parentId }).where(eq(student.id, ward.id))
          }
        }
      }
    })

    return { success: true, staffCode }
  } catch (dbError: any) {
    console.error('DB Error during teacher registration:', dbError)
    await deleteAuthUserIfCreated(userId, authUser.created === true)
    const rawMsg = dbError?.message || ''
    const friendlyMsg = rawMsg.includes('unique') || rawMsg.includes('duplicate')
      ? 'A staff member with these profile details is already registered.'
      : 'Teacher registration failed. Please check your details and try again.'
    return { error: friendlyMsg }
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

  if (!userPassword) {
    return { error: 'Password is required for this account.' }
  }

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
            password: userPassword,
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
            password: userPassword,
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
              .set({ userId: realUserId!, updatedAt: new Date() })
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
    password: userPassword
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
  adminLevel?: string
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const selectedRole = data.role?.toUpperCase()
  const identifier = (data.identifier || '').trim()

  if (!identifier || !data.password) {
    return { error: 'Email or staff ID and password are required.' }
  }

  let email = normalizeEmail(identifier)

  if (selectedRole === 'SUPER_ADMIN') {
    const isSuperAdmin = await isSuperAdminEmail(email)
    if (!isSuperAdmin) {
      return { error: 'Access denied: Only authorized Super Admin email can access this portal.' }
    }
  }

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

  if (signInResult.error) return { error: signInResult.error.message }
  if (!signInResult.data.user) return { error: 'Sign-in failed. Please try again.' }

  const userId = signInResult.data.user.id

  // Synchronize user record in Supabase Database
  try {
    const existingLocalUser = await db.query.user.findFirst({
      where: or(eq(userTable.id, userId), eq(userTable.email, email))
    })
    if (!existingLocalUser) {
      await db.insert(userTable).values({
        id: userId,
        email: email,
        name: signInResult.data.user.user_metadata?.full_name || 'User',
      }).onConflictDoNothing()
    }
  } catch (syncErr) {
    console.warn('[Auth] User sync warning on login:', syncErr)
  }

  // Verify user's assigned role from database userRole table
  const existingRole = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })

  const targetRoleName = selectedRole === 'SCHOOL_ADMIN' ? 'ADMIN' : selectedRole

  if (existingRole && existingRole.role !== targetRoleName && existingRole.role !== 'SUPER_ADMIN') {
    return { error: `This account is registered as '${existingRole.role}' and cannot access the '${selectedRole}' portal.` }
  }

  if (!existingRole) {
    await db.insert(userRole).values({
      id: randomUUID(),
      userId: userId,
      role: targetRoleName
    }).onConflictDoNothing()
  }

  // Update or insert schoolAdminRoles level if adminLevel is supplied
  if (data.adminLevel && (targetRoleName === 'ADMIN' || selectedRole === 'SCHOOL_ADMIN')) {
    try {
      const userRec = await db.query.user.findFirst({ where: eq(userTable.id, userId) })
      if (userRec?.schoolId) {
        const { schoolAdminRoles } = await import('@/lib/db/schema')
        await db.insert(schoolAdminRoles).values({
          id: randomUUID(),
          schoolId: userRec.schoolId,
          userId: userId,
          level: data.adminLevel,
          isActive: true,
        }).onConflictDoUpdate({
          target: [schoolAdminRoles.schoolId, schoolAdminRoles.userId],
          set: { level: data.adminLevel }
        })
      }
    } catch (err) {
      console.warn('[Auth] Could not update schoolAdminRoles level on login:', err)
    }
  }

  return { success: true }
}
