'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student, payment, subject } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { generateAdmissionNumber, generateStaffId } from '@/lib/id'

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

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  // Generate unique 6-digit admission or pupil number
  const admissionNumber = generateAdmissionNumber(studentClass)

  const selectedSubjects = Array.isArray(subjectsDone) ? subjectsDone.map((item: unknown) => String(item).trim()).filter(Boolean) : []
  if (!selectedSubjects.length) return { error: 'Select at least one subject.' }
  if (selectedSubjects.some(item => item.length > 100)) return { error: 'Subject names must be 100 characters or fewer.' }

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  let userId: any = randomUUID()
  let supabaseSignedUp = false

  if (isDummySupabase) return { error: 'Supabase authentication is not configured. Registration is unavailable until it is configured.' }

  if (!isDummySupabase) {
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
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

      if (!authError && authData.user) {
        userId = authData.user.id
        supabaseSignedUp = true
      }
    } catch (err) {
      console.error('Supabase student signup failed.', err)
    }
  }

  if (!supabaseSignedUp) return { error: 'Could not create the Supabase account. Please try again.' }

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
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function registerParent(data: any) {
  const { firstName, lastName, email, phone, occupation, profileImage, password, wardAdmissionNumber } = data

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  let userId: any = randomUUID()
  let supabaseSignedUp = false

  if (isDummySupabase) return { error: 'Supabase authentication is not configured. Registration is unavailable until it is configured.' }

  if (!isDummySupabase) {
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
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

      if (!authError && authData.user) {
        userId = authData.user.id
        supabaseSignedUp = true
      }
    } catch (err) {
      console.error('Supabase parent signup failed.', err)
    }
  }

  if (!supabaseSignedUp) return { error: 'Could not create the Supabase account. Please try again.' }

  try {
    const registration = await db.transaction(async (tx) => {
      const parentId = randomUUID()
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
        id: parentId,
        userId: userId,
        firstName,
        lastName,
        phoneNumber: phone,
        occupation: occupation || null,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null
      })

      if (!wardAdmissionNumber) return null
      const ward = await tx.query.student.findFirst({
        where: eq(student.admissionNumber, wardAdmissionNumber.trim().toUpperCase())
      })
      if (!ward) throw new Error('The selected child was not found.')
      if (ward.parentId) throw new Error('This child is already linked to a parent account.')

      const reference = `EGIA-REG-${Date.now()}-${randomUUID().slice(0, 8)}`
      await tx.update(student).set({ parentId }).where(eq(student.id, ward.id))
      const createdPayment = (await tx.insert(payment).values({
        id: randomUUID(), studentId: ward.id, parentId, amount: '2000.00', feeType: 'registration',
        paymentMethod: 'KORAPAY', transactionReference: reference, status: 'pending',
        description: `Parent registration for ${ward.firstName} ${ward.lastName}`,
      }).returning())[0]
      return { reference, paymentId: createdPayment.id }
    })

    if (!registration) return { success: true }
    const url = new URL('https://checkout.korapay.com/pay/BHba4zdsceZDgyW')
    url.searchParams.set('reference', registration.reference)
    return { success: true, checkoutUrl: url.toString(), paymentId: registration.paymentId }
  } catch (dbError: any) {
    console.error('DB Error:', dbError)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function registerTeacher(data: any) {
  const { firstName, lastName, email, profileImage, password } = data

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  // Generate dynamic unique 6-digit Staff ID
  const staffCode = generateStaffId()

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  let userId: any = randomUUID()
  let supabaseSignedUp = false

  if (isDummySupabase) return { error: 'Supabase authentication is not configured. Registration is unavailable until it is configured.' }

  if (!isDummySupabase) {
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
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

      if (!authError && authData.user) {
        userId = authData.user.id
        supabaseSignedUp = true
      }
    } catch (err) {
      console.error('Supabase teacher signup failed.', err)
    }
  }

  if (!supabaseSignedUp) return { error: 'Could not create the Supabase account. Please try again.' }

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
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}

export async function activateStudent(data: any) {
  const { admissionNumber, email, password } = data

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
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  const defaultStudentPassword = 'default'
  let userId: any = existingStudent.userId || randomUUID()
  let supabaseProvisioned = false

  if (isDummySupabase) return { error: 'Supabase authentication is not configured. Student activation is unavailable.' }

  if (!isDummySupabase) {
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: defaultStudentPassword,
        options: {
          data: {
            full_name: `${existingStudent.firstName} ${existingStudent.lastName}`,
            role: 'STUDENT',
            admission_number: admissionNumber.toUpperCase().trim()
          }
        }
      })

      if (!authError && authData.user) {
        userId = authData.user.id
        supabaseProvisioned = true
      } else if (authError) {
        console.warn('Supabase student signUp returned an error:', authError.message)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: defaultStudentPassword
        })
        if (!signInError && signInData.user) {
          userId = signInData.user.id
          supabaseProvisioned = true
        }
      }
    } catch (err) {
      console.error('Supabase student activation failed.', err)
    }
  }

  if (!supabaseProvisioned) return { error: 'Could not create or verify the Supabase student account.' }

  try {
    await db.transaction(async (tx) => {
      const existingLocalUser = await tx.query.user.findFirst({
        where: eq(userTable.email, email)
      })

      if (!existingLocalUser) {
        await tx.insert(userTable).values({
          id: userId,
          email: email,
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
    })

    return { success: true }
  } catch (dbError: any) {
    console.error('Activation DB link failed:', dbError)
    return { error: 'Activation DB link failed' }
  }
}

export async function loginStudent(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const admissionNumber = (data.admissionNumber || '').toString().toUpperCase().trim()

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

  let resolvedEmail: string | null = null
  let resolvedUserId: string | null = existingStudent.userId || null
  let userRecord: any = null

  if (resolvedUserId) {
    userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, resolvedUserId)
    })
    resolvedEmail = userRecord?.email || null
  }

  if (!resolvedEmail && process.env.SUPABASE_SECRET_KEY) {
    try {
      const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()
        if (!listError && usersData?.users) {
          const found = usersData.users.find((u: any) => {
            return u.user_metadata?.admission_number?.toString().toUpperCase().trim() === admissionNumber
          })

          if (found && found.email) {
            const mappedEmail = found.email
            const mappedUserId = found.id
            resolvedEmail = mappedEmail
            resolvedUserId = mappedUserId

            await db.transaction(async (tx) => {
              const existingLocalUser = await tx.query.user.findFirst({
                where: eq(userTable.email, mappedEmail)
              })

              if (!existingLocalUser) {
                await tx.insert(userTable).values({
                  id: mappedUserId,
                  email: mappedEmail,
                  name: `${existingStudent.firstName} ${existingStudent.lastName}`
                })
              }

              if (!existingStudent.userId) {
                await tx.update(student)
                  .set({ userId: resolvedUserId })
                  .where(eq(student.id, existingStudent.id))
              }
            })
          }
        }
      }
    } catch (err) {
      console.warn('Could not resolve Supabase admission mapping during student login.', err)
    }
  }

  // Admissions imported by the school may not yet have an Auth identity. Provision a
  // non-mailbox portal identity on the first admission-number login; the learner can
  // replace the initial password from Settings after entering the portal.
  if (!resolvedEmail && process.env.SUPABASE_SECRET_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
      const adminClient = createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const portalEmail = `student.${admissionNumber.toLowerCase()}@portal.egia.local`
      const { data, error } = await adminClient.auth.admin.createUser({
        email: portalEmail, password: 'default', email_confirm: true,
        user_metadata: { full_name: `${existingStudent.firstName} ${existingStudent.lastName}`, role: 'STUDENT', admission_number: admissionNumber },
      })
      if (!error && data.user) {
        resolvedEmail = portalEmail
        resolvedUserId = data.user.id
        await db.transaction(async (tx) => {
          await tx.insert(userTable).values({ id: data.user!.id, email: portalEmail, name: `${existingStudent.firstName} ${existingStudent.lastName}` }).onConflictDoNothing()
          await tx.insert(userRole).values({ id: randomUUID(), userId: data.user!.id, role: 'STUDENT' }).onConflictDoNothing()
          await tx.update(student).set({ userId: data.user!.id, password: 'default', updatedAt: new Date() }).where(eq(student.id, existingStudent.id))
        })
      }
    } catch (err) {
      console.warn('Could not provision an admission-only student portal account.', err)
    }
  }

  if (!resolvedEmail) {
    return { error: 'Student admission exists, but portal provisioning is unavailable. Please contact support.' }
  }

  const loginPassword = existingStudent.password || 'default'
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: loginPassword
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Student sign-in failed. Please try again.' }
  }

  const roleData = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, authData.user.id), eq(userRole.role, 'STUDENT'))
  })

  if (!roleData) {
    await supabase.auth.signOut()
    return { error: 'Access denied. Your account is not configured as a student.' }
  }

  return { success: true }
}

export async function loginAdmin(data: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { email, password } = data

  const adminPass = process.env.ADMIN_PASSWORD || 'GOODNEWS20@'

  // Specific requirement: Ensure Admin can log in using admin@egia.com and password GOODNEWS20@
  if (email.toLowerCase() === 'admin@egia.com' && password === adminPass) {
    try {
      const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const adminClient = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
        if (!listError && users) {
          const found = users.find(u => u.email?.toLowerCase() === 'admin@egia.com')
          if (!found) {
            const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
              email: 'admin@egia.com',
              password: adminPass,
              email_confirm: true,
              user_metadata: {
                full_name: 'El Goodnews Admin',
                role: 'ADMIN'
              }
            })
            if (!createError && createdUser.user) {
              await db.transaction(async (tx) => {
                await tx.insert(userTable).values({
                  id: createdUser.user.id,
                  email: 'admin@egia.com',
                  name: 'El Goodnews Admin'
                }).onConflictDoNothing()

                await tx.insert(userRole).values({
                  id: randomUUID(),
                  userId: createdUser.user.id,
                  role: 'ADMIN'
                }).onConflictDoNothing()
              })
            }
          } else {
            await adminClient.auth.admin.updateUserById(found.id, {
              password: adminPass,
              user_metadata: {
                role: 'ADMIN'
              }
            })

            const existingRole = await db.query.userRole.findFirst({
              where: eq(userRole.userId, found.id)
            })
            if (!existingRole) {
              await db.transaction(async (tx) => {
                await tx.insert(userTable).values({
                  id: found.id,
                  email: 'admin@egia.com',
                  name: 'El Goodnews Admin'
                }).onConflictDoNothing()

                await tx.insert(userRole).values({
                  id: randomUUID(),
                  userId: found.id,
                  role: 'ADMIN'
                }).onConflictDoNothing()
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to seed/sync admin user in Supabase:', err)
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id

  if (email.toLowerCase() === 'admin@egia.com') {
    // Ensure admin user role exists in the local database
    const existingRole = await db.query.userRole.findFirst({
      where: eq(userRole.userId, userId)
    })
    if (!existingRole) {
      try {
        await db.transaction(async (tx) => {
          await tx.insert(userTable).values({
            id: userId,
            email: email.toLowerCase(),
            name: 'El Goodnews Admin'
          }).onConflictDoNothing()

          await tx.insert(userRole).values({
            id: randomUUID(),
            userId: userId,
            role: 'ADMIN'
          }).onConflictDoNothing()
        })
      } catch (err) {
        console.error("loginAdmin: Failed to auto-seed local admin row:", err)
      }
    }
  }

  const roleData = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, userId), eq(userRole.role, 'ADMIN'))
  })

  if (!roleData) return { error: 'Access denied' }

  return { success: true }
}

export async function registerParentTeacher(data: any) {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    childFirstName,
    childMiddleName,
    childLastName,
    childDOB,
    childClass,
    profileImage
  } = data

  // Check if account already exists in database
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  let userId: any = randomUUID()
  let supabaseSignedUp = false

  if (isDummySupabase) return { error: 'Supabase authentication is not configured. Registration is unavailable until it is configured.' }

  if (!isDummySupabase) {
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            role: 'PARENT'
          }
        }
      })

      if (!authError && authData.user) {
        userId = authData.user.id
        supabaseSignedUp = true
      }
    } catch (err) {
      console.error('Supabase parent-teacher signup failed.', err)
    }
  }

  if (!supabaseSignedUp) return { error: 'Could not create the Supabase account. Please try again.' }

  try {
    const parentId = randomUUID()
    const teacherId = randomUUID()
    const childStudentId = randomUUID()
    const admissionNumber = generateAdmissionNumber(childClass)
    const staffCode = generateStaffId()
    const registrationReference = `REG-${Date.now()}-${randomUUID().slice(0, 8)}`

    await db.transaction(async (tx) => {
      // 1. Insert Parent / Teacher User Row
      await tx.insert(userTable).values({
        id: userId,
        email: email,
        name: `${firstName} ${lastName}`,
        image: profileImage || null
      })

      // 2. Insert User Role Row (Primary role: PARENT)
      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: userId,
        role: 'PARENT',
      })

      // 3. Insert Parent Profile Record
      await tx.insert(parent).values({
        id: parentId,
        userId: userId,
        firstName,
        lastName,
        phoneNumber: phone,
        profileImage: profileImage || null
      })

      // 4. Insert Teacher Profile Record (since they are a Parent who is a Teacher)
      await tx.insert(teacher).values({
        id: teacherId,
        userId: userId,
        staffCode,
        firstName,
        lastName,
        profileImage: profileImage || null,
        status: 'APPROVED', // Pre-approved as they are registered staff
        isActive: true
      })

      // Child authentication is provisioned on their first admission-number login,
      // so no unusable local-only identity is created here.
      await tx.insert(student).values({
        id: childStudentId,
        firstName: childFirstName,
        middleName: childMiddleName || null,
        lastName: childLastName,
        dateOfBirth: childDOB ? childDOB : null,
        class: childClass,
        admissionNumber,
        parentId: parentId,
        password: 'default',
        isActive: true,
        registrationStatus: 'PENDING_PAYMENT'
      })

      // The record stays pending until Korapay's signed webhook confirms it.
      await tx.insert(payment).values({
        id: randomUUID(),
        studentId: childStudentId,
        parentId: parentId,
        amount: '2000.00',
        feeType: 'registration',
        paymentMethod: 'KORAPAY',
        transactionReference: registrationReference,
        status: 'pending',
        description: 'Parent registration — awaiting Korapay confirmation',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    const checkout = new URL(process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW')
    checkout.searchParams.set('reference', registrationReference)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl) checkout.searchParams.set('redirect_url', `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(registrationReference)}`)
    return { success: true, checkoutUrl: checkout.toString() }
  } catch (dbError: any) {
    console.error('DB Error in registerParentTeacher:', dbError)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}
