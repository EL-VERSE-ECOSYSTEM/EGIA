'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student, payment } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { generateAdmissionNumber, generateStaffId } from '@/lib/id'

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

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  let userId: any = randomUUID()
  let supabaseSignedUp = false

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
      console.warn('Supabase signUp threw exception, falling back to local DB registration.', err)
    }
  }

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
        subjectsDone: subjectsDone || null,
        profileImage: profileImage || null,
        facialVerificationVideo: data.facialVerificationVideo || null,
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
  const { firstName, lastName, email, phone, occupation, profileImage, password } = data

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
      console.warn('Supabase signUp threw exception, falling back to local DB registration.', err)
    }
  }

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
      console.warn('Supabase signUp threw exception, falling back to local DB registration.', err)
    }
  }

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

  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, email)
  })

  if (existingUser) {
    return { error: 'Account already exists. An account with this email is already registered.' }
  }

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  const defaultStudentPassword = 'default'
  let userId: any = existingStudent.userId || randomUUID()

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
      } else if (authError) {
        console.warn('Supabase student signUp returned an error:', authError.message)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: defaultStudentPassword
        })
        if (!signInError && signInData.user) {
          userId = signInData.user.id
        }
      }
    } catch (err) {
      console.warn('Supabase signUp threw exception, falling back to local DB registration.', err)
    }
  }

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
            resolvedEmail = found.email
            resolvedUserId = found.id

            await db.transaction(async (tx) => {
              const existingLocalUser = await tx.query.user.findFirst({
                where: eq(userTable.email, resolvedEmail)
              })

              if (!existingLocalUser) {
                await tx.insert(userTable).values({
                  id: resolvedUserId,
                  email: resolvedEmail,
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

  if (!resolvedEmail) {
    return { error: 'Student portal account is not yet configured. Please contact support.' }
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
    where: and(eq(userRole.userId, resolvedUserId || existingStudent.userId), eq(userRole.role, 'STUDENT'))
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
      }
    } catch (err) {
      console.warn('Supabase signUp threw exception, falling back to local DB registration.', err)
    }
  }

  try {
    const parentId = randomUUID()
    const teacherId = randomUUID()
    const childStudentId = randomUUID()
    const childUserId = randomUUID()
    const admissionNumber = generateAdmissionNumber(childClass)
    const staffCode = generateStaffId()

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

      // 5. Create Child's User Row
      await tx.insert(userTable).values({
        id: childUserId,
        email: `student.${admissionNumber.toLowerCase()}@egia.com`,
        name: `${childFirstName} ${childLastName}`,
        image: null
      })

      // 6. Create Child's User Role Row
      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: childUserId,
        role: 'STUDENT'
      })

      // 7. Create Child's Student Record (with default password 'default' inside student table)
      await tx.insert(student).values({
        id: childStudentId,
        userId: childUserId,
        firstName: childFirstName,
        middleName: childMiddleName || null,
        lastName: childLastName,
        dateOfBirth: childDOB ? childDOB : null,
        class: childClass,
        admissionNumber,
        parentId: parentId,
        password: 'default',
        isActive: true
      })

      // 8. Insert Paid for Registration - ₦2,000 transaction
      await tx.insert(payment).values({
        id: randomUUID(),
        studentId: childStudentId,
        parentId: parentId,
        amount: '2000.00',
        feeType: 'registration',
        paymentMethod: 'ONLINE',
        transactionReference: `REG-${Date.now()}`,
        korapayReference: `KORA-REG-${Date.now()}`,
        status: 'success',
        paymentDate: new Date(),
        paidAt: new Date(),
        description: 'Paid for Registration - ₦2,000',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })

    return { success: true }
  } catch (dbError: any) {
    console.error('DB Error in registerParentTeacher:', dbError)
    return { error: 'Account creation failed in local database. Please contact support.' }
  }
}
