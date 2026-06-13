'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, userRole, student, teacher, parent } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getCurrentUser() {
  const userId = await getUserId()
  return await db.query.user.findFirst({
    where: eq(user.id, userId),
  })
}

export async function getUserRole(): Promise<'admin' | 'teacher' | 'parent' | 'student' | null> {
  const userId = await getUserId()
  const roleData = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })

  if (!roleData) return null

  const validRoles = ['admin', 'teacher', 'parent', 'student'] as const
  if (validRoles.includes(roleData.role as any)) {
    return roleData.role as 'admin' | 'teacher' | 'parent' | 'student'
  }

  return null
}

export async function getStudentProfile() {
  const userId = await getUserId()
  return await db.query.student.findFirst({
    where: eq(student.userId, userId),
  })
}

export async function getTeacherProfile() {
  const userId = await getUserId()
  return await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId),
  })
}

export async function getParentProfile() {
  const userId = await getUserId()
  return await db.query.parent.findFirst({
    where: eq(parent.userId, userId),
  })
}

export async function createStudentProfile(data: {
  firstName: string
  lastName: string
  class: string
  dateOfBirth?: Date
  gender?: string
  admissionNumber?: string
}) {
  const userId = await getUserId()
  const studentId = `STU-${Date.now()}`

  const validClasses = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'] as const
  if (!validClasses.includes(data.class as any)) {
    throw new Error('Invalid class')
  }

  return await db.transaction(async (tx) => {
    await tx.insert(userRole).values({
      id: crypto.randomUUID(),
      userId,
      role: 'student',
    })

    const result = await tx.insert(student).values({
      id: crypto.randomUUID(),
      userId,
      studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      class: data.class as typeof validClasses[number],
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      admissionNumber: data.admissionNumber,
    }).returning()

    revalidatePath('/')
    return result[0]
  })
}

export async function createAdminProfile() {
  const userId = await getUserId()

  await db.insert(userRole).values({
    id: crypto.randomUUID(),
    userId,
    role: 'admin',
  })

  revalidatePath('/')
  return { success: true }
}

export async function createTeacherProfile(data: {
  firstName: string
  lastName: string
  qualification?: string
  specialization?: string
  dateOfBirth?: Date
  gender?: string
  joinDate?: Date
}) {
  const userId = await getUserId()
  const teacherId = `TEACH-${Date.now()}`

  return await db.transaction(async (tx) => {
    await tx.insert(userRole).values({
      id: crypto.randomUUID(),
      userId,
      role: 'teacher',
    })

    const result = await tx.insert(teacher).values({
      id: crypto.randomUUID(),
      userId,
      teacherId,
      firstName: data.firstName,
      lastName: data.lastName,
      qualification: data.qualification,
      specialization: data.specialization,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      joinDate: data.joinDate,
    }).returning()

    revalidatePath('/')
    return result[0]
  })
}

export async function createParentProfile(data: {
  firstName: string
  lastName: string
  relationship: 'father' | 'mother' | 'guardian' | 'other'
  phoneNumber?: string
  occupation?: string
  address?: string
}) {
  const userId = await getUserId()
  const parentId = `PAR-${Date.now()}`

  return await db.transaction(async (tx) => {
    await tx.insert(userRole).values({
      id: crypto.randomUUID(),
      userId,
      role: 'parent',
    })

    const result = await tx.insert(parent).values({
      id: crypto.randomUUID(),
      userId,
      parentId,
      firstName: data.firstName,
      lastName: data.lastName,
      relationship: data.relationship,
      phoneNumber: data.phoneNumber,
      occupation: data.occupation,
      address: data.address,
    }).returning()

    revalidatePath('/')
    return result[0]
  })
}

export async function linkChildToParent(admissionNumber: string, parentId: string) {
  const result = await db.update(student)
    .set({ parentId })
    .where(eq(student.admissionNumber, admissionNumber))
    .returning()

  revalidatePath('/dashboard/parent/overview')
  return result[0]
}

export async function updateUserProfile(data: {
  name?: string
  image?: string
}) {
  const userId = await getUserId()

  const result = await db.update(user)
    .set({
      name: data.name,
      image: data.image,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  revalidatePath('/')
  return result[0]
}
