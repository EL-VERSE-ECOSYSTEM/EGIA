'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, parent, userRole, teacher, user as userTable, notification, payment, academicSession, term } from '@/lib/db/schema'
import { eq, and, desc, count, isNull, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { generateAdmissionNumber } from '@/lib/id'

export async function getStudentEmailByAdmissionNumber(admissionNumber: string) {
  const studentProfile = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber),
    with: {
      user: true
    }
  })
  return studentProfile?.user?.email || null
}

export async function getStaffEmailByStaffId(staffId: string) {
  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.staffCode, staffId),
    with: {
      user: true
    }
  })
  return teacherProfile?.user?.email || null
}

export async function linkChild(admissionNumber: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'PARENT') {
    throw new Error('Unauthorized')
  }

  const parentProfile = await db.query.parent.findFirst({
    where: eq(parent.userId, session.user.id)
  })

  if (!parentProfile) throw new Error('Parent profile not found')

  const linkedCount = await db.select({ value: count() }).from(student).where(eq(student.parentId, parentProfile.id))
  if ((linkedCount[0]?.value || 0) >= 5) throw new Error('A parent account can be linked to a maximum of 5 children.')

  const child = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase())
  })

  if (!child) throw new Error('Student with this admission number not found')

  if (child.parentId) throw new Error('This student is already linked to a parent account')

  const currentSession = await db.query.academicSession.findFirst({
    where: eq(academicSession.isCurrent, true)
  })
  const currentTerm = await db.query.term.findFirst({
    where: eq(term.isCurrent, true)
  })

  await db.update(student)
    .set({
      parentId: parentProfile.id,
      termId: currentTerm?.id || child.termId || null,
      sessionId: currentSession?.id || child.sessionId || null,
      updatedAt: new Date()
    })
    .where(eq(student.id, child.id))

  // Link in plural public.students table for dynamic synchronization
  try {
    await db.execute(sql`
      UPDATE public.students
      SET
        current_session = ${currentSession?.name || null},
        updated_at = NOW()
      WHERE admission_number = ${admissionNumber.trim().toUpperCase()}
    `)
  } catch (err) {
    console.warn('Could not sync update to public.students table:', err)
  }

  try {
    await db.execute(sql`
      INSERT INTO public.parent_students (id, parent_id, student_id, is_guardian, relationship, created_at)
      VALUES (
        ${randomUUID()}::uuid,
        ${parentProfile.id}::uuid,
        ${child.id}::uuid,
        true,
        'PARENT',
        NOW()
      )
      ON CONFLICT DO NOTHING
    `)
  } catch (err) {
    console.warn('Could not sync insert to public.parent_students table:', err)
  }

  // Administrative admissions are provisioned without a fee. Once a parent links the
  // child, make that existing ledger entry visible in both account histories.
  await db.update(payment).set({ parentId: parentProfile.id, updatedAt: new Date() })
    .where(and(eq(payment.studentId, child.id), isNull(payment.parentId)))

  revalidatePath('/dashboard/parent/children/list')
  return { success: true, name: `${child.firstName} ${child.lastName}` }
}

export async function getLinkedChildren() {
  const session = await auth.getSession()
  if (!session?.user) return []

  const parentProfile = await db.query.parent.findFirst({
    where: eq(parent.userId, session.user.id)
  })

  if (!parentProfile) return []

  return await db.query.student.findMany({
    where: eq(student.parentId, parentProfile.id)
  })
}

export async function createAdminProfile() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await db.transaction(async (tx) => {
    // Check if role already exists
    const existing = await tx.query.userRole.findFirst({
      where: eq(userRole.userId, session.user.id)
    })

    if (!existing) {
      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: session.user.id,
        role: 'ADMIN',
      })
    }
  })

  return { success: true }
}

export async function getStudentByAdmissionNumber(admissionNumber: string) {
  const s = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber)
  })
  if (!s) return null
  return {
    name: `${s.firstName} ${s.lastName}`,
    admissionNumber: s.admissionNumber,
    class: s.class
  }
}

export async function checkWardLinkingStatus(admissionNumber: string) {
  const cleanNum = admissionNumber.trim().toUpperCase()
  if (!cleanNum) throw new Error('Please enter a valid admission number.')

  // Query database to find student
  const lowercaseStudent = await db.query.student.findFirst({
    where: eq(student.admissionNumber, cleanNum)
  })

  if (!lowercaseStudent) {
    return { found: false, message: 'Student/pupil not found in the academy database.' }
  }

  const session = await auth.getSession()
  let parentProfile = null
  if (session?.user?.id) {
    parentProfile = await db.query.parent.findFirst({
      where: eq(parent.userId, session.user.id)
    })
  }

  // Determine linkage state
  const hasParentId = lowercaseStudent.parentId !== null && lowercaseStudent.parentId !== ''
  const isLinkedToMe = parentProfile && lowercaseStudent.parentId === parentProfile.id

  let status: 'NOT_LINKED' | 'LINKED_TO_ME' | 'LINKED_TO_ANOTHER' = 'NOT_LINKED'
  if (hasParentId) {
    if (isLinkedToMe) {
      status = 'LINKED_TO_ME'
    } else {
      status = 'LINKED_TO_ANOTHER'
    }
  }

  return {
    found: true,
    id: lowercaseStudent.id,
    name: `${lowercaseStudent.firstName} ${lowercaseStudent.lastName}`,
    admissionNumber: lowercaseStudent.admissionNumber,
    class: lowercaseStudent.class,
    parentId: lowercaseStudent.parentId,
    sessionId: lowercaseStudent.sessionId,
    termId: lowercaseStudent.termId,
    status,
    message: status === 'LINKED_TO_ME'
      ? 'This ward is already linked to your parent account.'
      : status === 'LINKED_TO_ANOTHER'
      ? 'This ward is already linked to another parent account.'
      : 'This ward is not linked to any parent account and is available.'
  }
}

export async function getLoggedInNotifications() {
  const session = await auth.getSession()
  if (!session?.user) return []

  // Get user's schoolId to scope notifications by school
  const userRecord = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id)
  })
  const userSchoolId = userRecord?.schoolId

  if (userSchoolId) {
    const list = await db.select()
      .from(notification)
      .where(
        or(
          eq(notification.userId, session.user.id),
          and(
            eq(notification.schoolId, userSchoolId),
            isNull(notification.userId)
          )
        )
      )
      .orderBy(desc(notification.createdAt))
      .limit(25)
    return list || []
  }

  const list = await db.select()
    .from(notification)
    .where(eq(notification.userId, session.user.id))
    .orderBy(desc(notification.createdAt))
    .limit(25)

  return list || []
}

export async function createParentProfile(data: {
  firstName: string
  lastName: string
  phoneNumber: string
  wardAdmissionNumber?: string
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  return await db.transaction(async (tx) => {
    const existingParent = await tx.query.parent.findFirst({ where: eq(parent.userId, session.user.id) })
    if (existingParent) throw new Error('A parent profile already exists for this account.')
    const parentId = randomUUID()

    await tx.insert(userRole).values({
      id: randomUUID(),
      userId: session.user.id,
      role: 'PARENT',
    })

    await tx.insert(parent).values({
      id: parentId,
      userId: session.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
    })

    if (data.wardAdmissionNumber) {
      const linkedCount = await tx.select({ value: count() }).from(student).where(eq(student.parentId, parentId))
      if ((linkedCount[0]?.value || 0) >= 5) throw new Error('A parent account can be linked to a maximum of 5 children.')
      const child = await tx.query.student.findFirst({
        where: eq(student.admissionNumber, data.wardAdmissionNumber.trim().toUpperCase())
      })

      if (child && !child.parentId) {
        const currentSession = await tx.query.academicSession.findFirst({
          where: eq(academicSession.isCurrent, true)
        })
        const currentTerm = await tx.query.term.findFirst({
          where: eq(term.isCurrent, true)
        })

        await tx.update(student)
          .set({
            parentId: parentId,
            termId: currentTerm?.id || child.termId || null,
            sessionId: currentSession?.id || child.sessionId || null,
            updatedAt: new Date()
          })
          .where(eq(student.id, child.id))

        // Link in plural public.students table for dynamic synchronization
        try {
          await tx.execute(sql`
            UPDATE public.students
            SET
              current_session = ${currentSession?.name || null},
              updated_at = NOW()
            WHERE admission_number = ${data.wardAdmissionNumber.trim().toUpperCase()}
          `)
        } catch (err) {
          console.warn('Could not sync update to public.students table:', err)
        }

        try {
          await tx.execute(sql`
            INSERT INTO public.parent_students (id, parent_id, student_id, is_guardian, relationship, created_at)
            VALUES (
              ${randomUUID()}::uuid,
              ${parentId}::uuid,
              ${child.id}::uuid,
              true,
              'PARENT',
              NOW()
            )
            ON CONFLICT DO NOTHING
          `)
        } catch (err) {
          console.warn('Could not sync insert to public.parent_students table:', err)
        }
      }
    }

    return { success: true }
  })
}

export async function createStudentProfile(data: {
  firstName: string
  lastName: string
  class: string
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const studentId = randomUUID()
  const admissionNumber = generateAdmissionNumber(data.class)

  await db.transaction(async (tx) => {
    await tx.insert(userRole).values({
      id: randomUUID(),
      userId: session.user.id,
      role: 'STUDENT',
    })

    await tx.insert(student).values({
      id: studentId,
      userId: session.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      class: data.class,
      admissionNumber: admissionNumber,
    })
  })

  // Sync write to public.users table (executed outside main transaction to prevent rollback issues)
  try {
    await db.execute(sql`
      INSERT INTO public.users (id, email, full_name, role, is_active, is_verified, created_at, updated_at)
      VALUES (
        ${session.user.id}::uuid,
        ${session.user.email},
        ${`${data.firstName} ${data.lastName}`},
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
    await db.execute(sql`
      INSERT INTO public.students (
        id, user_id, admission_number, first_name, last_name, current_class, is_graduated, created_at, updated_at
      ) VALUES (
        ${studentId}::uuid,
        ${session.user.id}::uuid,
        ${admissionNumber},
        ${data.firstName},
        ${data.lastName},
        ${data.class},
        false,
        NOW(),
        NOW()
      )
      ON CONFLICT (admission_number) DO NOTHING
    `)
  } catch (err) {
    console.warn('Could not sync insert to public.students table:', err)
  }

  return { success: true }
}

export async function createTeacherProfile(data: {
  firstName: string
  lastName: string
  staffCode: string
  type?: 'CLASS' | 'SUBJECT'
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const teacherId = randomUUID()

  await db.transaction(async (tx) => {
    await tx.insert(userRole).values({
      id: randomUUID(),
      userId: session.user.id,
      role: 'TEACHER',
    })

    await tx.insert(teacher).values({
      id: teacherId,
      userId: session.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      staffCode: data.staffCode,
      type: data.type || 'SUBJECT',
    })
  })

  // Sync write to public.users table (executed outside main transaction to prevent rollback issues)
  try {
    await db.execute(sql`
      INSERT INTO public.users (id, email, full_name, role, is_active, is_verified, created_at, updated_at)
      VALUES (
        ${session.user.id}::uuid,
        ${session.user.email},
        ${`${data.firstName} ${data.lastName}`},
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
    await db.execute(sql`
      INSERT INTO public.teachers (
        id, user_id, staff_id, first_name, last_name, is_class_teacher, created_at, updated_at
      ) VALUES (
        ${teacherId}::uuid,
        ${session.user.id}::uuid,
        ${data.staffCode},
        ${data.firstName},
        ${data.lastName},
        false,
        NOW(),
        NOW()
      )
      ON CONFLICT (staff_id) DO NOTHING
    `)
  } catch (err) {
    console.warn('Could not sync insert to public.teachers table:', err)
  }

  return { success: true }
}

export async function getParentProfile(userId?: string) {
  if (!userId) {
    const session = await auth.getSession()
    if (!session?.user) return null
    userId = session.user.id
  }
  return await db.query.parent.findFirst({
    where: eq(parent.userId, userId),
    with: { user: true }
  })
}

export async function updateParentProfile(data: {
  firstName: string
  lastName: string
  phoneNumber: string
  address?: string
  occupation?: string
  profileImage?: string
}) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'PARENT') {
    throw new Error('Unauthorized')
  }

  const existingParent = await db.query.parent.findFirst({
    where: eq(parent.userId, session.user.id)
  })

  if (!existingParent) throw new Error('Parent profile not found.')

  await db.update(parent)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      address: data.address || null,
      occupation: data.occupation || null,
      profileImage: data.profileImage || existingParent.profileImage,
      updatedAt: new Date()
    })
    .where(eq(parent.id, existingParent.id))

  // Sync user full name
  await db.update(userTable)
    .set({
      name: `${data.firstName} ${data.lastName}`,
      image: data.profileImage || existingParent.profileImage,
      updatedAt: new Date()
    })
    .where(eq(userTable.id, session.user.id))

  revalidatePath('/dashboard/parent/settings/profile')
  revalidatePath('/dashboard/parent/overview')
  return { success: true }
}

export async function getStudentProfile(userId?: string) {
  if (!userId) {
    const session = await auth.getSession()
    if (!session?.user) return null
    userId = session.user.id
  }
  return await db.query.student.findFirst({
    where: eq(student.userId, userId)
  })
}

export async function getTeacherProfile(userId?: string) {
  if (!userId) {
    const session = await auth.getSession()
    if (!session?.user) return null
    userId = session.user.id
  }
  return await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
}

export async function getUserRole(userId: string) {
  const roleData = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId)
  })
  return roleData?.role || null
}

export async function updateStudentPassword(newPassword: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') {
    throw new Error('Unauthorized')
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

  if (updateError) {
    throw new Error(updateError.message)
  }

  await db.update(student)
    .set({ password: newPassword, updatedAt: new Date() })
    .where(eq(student.userId, session.user.id))

  return { success: true }
}

export async function deleteUserAccount() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = session.user.id

  // Delete local DB profiles (cascades to related tables due to DB constraint / Cascade rules)
  try {
    await db.delete(userTable).where(eq(userTable.id, userId))
    await db.delete(userRole).where(eq(userRole.userId, userId))
  } catch (dbErr) {
    console.warn("deleteUserAccount: DB records cleanup failed or was simulated:", dbErr)
  }

  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    await supabase.auth.signOut()
  } catch (authErr) {
    console.warn('deleteUserAccount: Auth session cleanup failed:', authErr)
  }

  return { success: true }
}
