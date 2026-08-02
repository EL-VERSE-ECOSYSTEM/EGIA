'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { user as userTable, userRole, parent, teacher, student, payment } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

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

  // Generate unique 6-digit admission number
  const admissionNumber = `GOD${Math.floor(100000 + Math.random() * 900000)}`

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
        facialVerificationVideo: data.facialVerificationVideo || null
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
  const staffCode = `EGIA-ST-${Math.floor(100000 + Math.random() * 900000)}`

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

export async function simulateLocalLogin(emailOrId: string, role: string) {
  // Direct bypass for default Admin
  if (emailOrId.toLowerCase() === 'admin@egia.com' && role === 'ADMIN') {
    let adminUser = await db.query.user.findFirst({
      where: eq(userTable.email, 'admin@egia.com')
    })
    if (!adminUser) {
      const adminId = randomUUID()
      await db.transaction(async (tx) => {
        await tx.insert(userTable).values({
          id: adminId,
          email: 'admin@egia.com',
          name: 'El Goodnews Admin'
        })
        await tx.insert(userRole).values({
          id: randomUUID(),
          userId: adminId,
          role: 'ADMIN'
        })
      })
      adminUser = { id: adminId, email: 'admin@egia.com', name: 'El Goodnews Admin', image: null, createdAt: new Date(), updatedAt: new Date() }
    }

    const cookieStore = await cookies()
    cookieStore.set('mock_user_session', adminUser.id, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return { success: true, userId: adminUser.id }
  }

  // Support student admission number lookup directly
  let targetUser: any = null

  if (role === 'STUDENT') {
    const s = await db.query.student.findFirst({
      where: eq(student.admissionNumber, emailOrId.toUpperCase().trim())
    })
    if (!s) {
      return { error: `No student found with admission number '${emailOrId}'` }
    }
    if (s.userId) {
      targetUser = await db.query.user.findFirst({
        where: eq(userTable.id, s.userId)
      })
    }
    if (!targetUser) {
      const newUserId = randomUUID()
      const normalizedAdmissionNumber = s.admissionNumber?.toLowerCase() || ''
      await db.transaction(async (tx) => {
        await tx.insert(userTable).values({
          id: newUserId,
          email: `student.${normalizedAdmissionNumber}@egia.com`,
          name: `${s.firstName} ${s.lastName}`,
          image: s.profileImage || null
        }).onConflictDoNothing()

        await tx.insert(userRole).values({
          id: randomUUID(),
          userId: newUserId,
          role: 'STUDENT'
        }).onConflictDoNothing()

        await tx.update(student)
          .set({ userId: newUserId })
          .where(eq(student.id, s.id))
      })
      targetUser = await db.query.user.findFirst({
        where: eq(userTable.id, newUserId)
      })
    }
  } else {
    // Find user by email directly for other roles
    targetUser = await db.query.user.findFirst({
      where: eq(userTable.email, emailOrId)
    })

    // Support staff ID
    if (!targetUser && role === 'TEACHER') {
      const t = await db.query.teacher.findFirst({
        where: eq(teacher.staffCode, emailOrId)
      })
      if (t) {
        targetUser = await db.query.user.findFirst({
          where: eq(userTable.id, t.userId)
        })
      }
    }
  }

  if (!targetUser) {
    return { error: `Account with details '${emailOrId}' not found.` }
  }

  // Check role
  const roleRecord = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, targetUser.id), eq(userRole.role, role))
  })

  if (!roleRecord) {
    return { error: `Unauthorized: You do not have the registered role of '${role}' on this account.` }
  }

  // Set mock session cookie
  const cookieStore = await cookies()
  cookieStore.set('mock_user_session', targetUser.id, {
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return { success: true, userId: targetUser.id }
}

export async function activateStudent(data: any) {
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
            full_name: `${existingStudent.firstName} ${existingStudent.lastName}`,
            role: 'STUDENT',
            admission_number: admissionNumber
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

  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  const adminPass = process.env.ADMIN_PASSWORD || 'GOODNEWS20@'

  // Specific requirement: Ensure Admin can log in using admin@egia.com and password GOODNEWS20@
  if (email.toLowerCase() === 'admin@egia.com' && password === adminPass) {
    if (isDummySupabase) {
      let adminUser = await db.query.user.findFirst({
        where: eq(userTable.email, 'admin@egia.com')
      })
      const adminId = adminUser?.id || randomUUID()
      if (!adminUser) {
        try {
          await db.transaction(async (tx) => {
            await tx.insert(userTable).values({
              id: adminId,
              email: 'admin@egia.com',
              name: 'El Goodnews Admin'
            }).onConflictDoNothing()

            await tx.insert(userRole).values({
              id: randomUUID(),
              userId: adminId,
              role: 'ADMIN'
            }).onConflictDoNothing()
          })
        } catch (err) {
          console.error("loginAdmin: Failed to auto-seed local admin row:", err)
        }
      }
      cookieStore.set('mock_user_session', adminId, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      return { success: true }
    } else {
      // Sync/Create/Update Admin user in Supabase securely on-the-fly
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
        console.error("Failed to seed/sync admin user in Supabase:", err)
      }
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
    const admissionNumber = `GOD${Math.floor(100000 + Math.random() * 900000)}`
    const staffCode = `EGIA-ST-${Math.floor(100000 + Math.random() * 900000)}`

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
