'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, parent, userRole, teacher, user as userTable } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

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

  const child = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber)
  })

  if (!child) throw new Error('Student with this admission number not found')

  if (child.parentId) throw new Error('This student is already linked to a parent account')

  await db.update(student)
    .set({ parentId: parentProfile.id })
    .where(eq(student.id, child.id))

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

export async function createParentProfile(data: {
  firstName: string
  lastName: string
  phoneNumber: string
  wardAdmissionNumber?: string
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  return await db.transaction(async (tx) => {
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
      const child = await tx.query.student.findFirst({
        where: eq(student.admissionNumber, data.wardAdmissionNumber)
      })

      if (child && !child.parentId) {
        await tx.update(student)
          .set({ parentId: parentId })
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

    const admissionNumber = `GOD${Math.floor(10000 + Math.random() * 90000)}`

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

export async function getParentProfile(userId: string) {
  return await db.query.parent.findFirst({
    where: eq(parent.userId, userId)
  })
}

export async function getStudentProfile(userId: string) {
  return await db.query.student.findFirst({
    where: eq(student.userId, userId)
  })
}

export async function getTeacherProfile(userId: string) {
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

export async function deleteUserAccount() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = session.user.id

  // Delete local DB profiles (cascades to related tables due to DB constraint / Cascade rules)
  await db.delete(userTable).where(eq(userTable.id, userId))
  await db.delete(userRole).where(eq(userRole.userId, userId))

  // Complete Supabase sign out
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()

  return { success: true }
}
