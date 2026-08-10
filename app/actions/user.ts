'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, parent, userRole, teacher, user as userTable, notification, payment, academicSession, term } from '@/lib/db/schema'
import { eq, and, desc, count, isNull } from 'drizzle-orm'
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

export async function getLoggedInNotifications() {
  const session = await auth.getSession()
  if (!session?.user) return []

  const list = await db.select()
    .from(notification)
    .where(eq(notification.userId, session.user.id))
    .orderBy(desc(notification.createdAt))
    .limit(15)

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

  await db.transaction(async (tx) => {
    await tx.insert(userRole).values({
      id: randomUUID(),
      userId: session.user.id,
      role: 'STUDENT',
    })

    const admissionNumber = generateAdmissionNumber(data.class)

    await tx.insert(student).values({
      id: randomUUID(),
      userId: session.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      class: data.class,
      admissionNumber: admissionNumber,
    })
  })

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

  await db.transaction(async (tx) => {
    await tx.insert(userRole).values({
      id: randomUUID(),
      userId: session.user.id,
      role: 'TEACHER',
    })

    await tx.insert(teacher).values({
      id: randomUUID(),
      userId: session.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      staffCode: data.staffCode,
      type: data.type || 'SUBJECT',
    })
  })

  return { success: true }
}

export async function getParentProfile(userId?: string) {
  if (!userId) {
    const session = await auth.getSession()
    if (!session?.user) return null
    userId = session.user.id
  }
  return await db.query.parent.findFirst({
    where: eq(parent.userId, userId)
  })
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
