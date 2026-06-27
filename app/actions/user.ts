'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, parent, userRole } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

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

export async function createAdminProfile(data: any) {
  return { success: true }
}

export async function createParentProfile(data: any) {
  return { success: true }
}

export async function createStudentProfile(data: any) {
  return { success: true }
}

export async function createTeacherProfile(data: any) {
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
