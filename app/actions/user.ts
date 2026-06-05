'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, userRole, student, teacher, parent } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
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
  return roleData?.role as 'admin' | 'teacher' | 'parent' | 'student' | null
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

  await db.insert(userRole).values({
    userId,
    role: 'student',
  })

  const result = await db.insert(student).values({
    userId,
    studentId,
    firstName: data.firstName,
    lastName: data.lastName,
    class: data.class as 'JSS1' | 'JSS2' | 'JSS3' | 'SSS1' | 'SSS2' | 'SSS3',
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    admissionNumber: data.admissionNumber,
  }).returning()

  revalidatePath('/')
  return result[0]
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

  await db.insert(userRole).values({
    userId,
    role: 'teacher',
  })

  const result = await db.insert(teacher).values({
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

  await db.insert(userRole).values({
    userId,
    role: 'parent',
  })

  const result = await db.insert(parent).values({
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
