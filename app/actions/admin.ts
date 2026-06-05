'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, student, teacher, parent as parentTable, userRole } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function isAdmin() {
  const userId = await getUserId()
  const role = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
  if (role?.role !== 'admin') throw new Error('Admin access required')
  return true
}

// Student Management
export async function getAllStudents() {
  await isAdmin()
  return db.query.student.findMany({
    with: {
      user: true,
    },
  })
}

export async function getStudent(studentId: string) {
  await isAdmin()
  return db.query.student.findFirst({
    where: eq(student.id, studentId),
    with: {
      user: true,
    },
  })
}

export async function createStudent(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  admissionNumber: string
  class: string
  dateOfBirth?: string
  gender?: string
}) {
  await isAdmin()

  // Create user first
  const newUser = await db.insert(user).values({
    id: crypto.randomUUID(),
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
  }).returning()

  if (!newUser[0]) throw new Error('Failed to create user')

  // Create role
  await db.insert(userRole).values({
    userId: newUser[0].id,
    role: 'student',
  })

  // Create student record
  const newStudent = await db.insert(student).values({
    userId: newUser[0].id,
    studentId: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    class: data.class,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    gender: data.gender,
  }).returning()

  return newStudent[0]
}

export async function updateStudent(studentId: string, data: Partial<{
  firstName: string
  lastName: string
  class: string
  dateOfBirth: string
  gender: string
}>) {
  await isAdmin()

  const result = await db.update(student)
    .set(data)
    .where(eq(student.id, studentId))
    .returning()

  return result[0]
}

export async function deleteStudent(studentId: string) {
  await isAdmin()

  const studentRecord = await db.query.student.findFirst({
    where: eq(student.id, studentId),
  })

  if (!studentRecord) throw new Error('Student not found')

  await db.delete(user).where(eq(user.id, studentRecord.userId))
  return true
}

// Teacher Management
export async function getAllTeachers() {
  await isAdmin()
  return db.query.teacher.findMany({
    with: {
      user: true,
    },
  })
}

export async function createTeacher(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  qualification?: string
  specialization?: string
}) {
  await isAdmin()

  const newUser = await db.insert(user).values({
    id: crypto.randomUUID(),
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
  }).returning()

  if (!newUser[0]) throw new Error('Failed to create user')

  await db.insert(userRole).values({
    userId: newUser[0].id,
    role: 'teacher',
  })

  const newTeacher = await db.insert(teacher).values({
    userId: newUser[0].id,
    teacherId: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    qualification: data.qualification,
    specialization: data.specialization,
  }).returning()

  return newTeacher[0]
}

// Parent Management
export async function getAllParents() {
  await isAdmin()
  return db.query.parent.findMany({
    with: {
      user: true,
    },
  })
}

export async function createParent(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber?: string
  relationship?: string
}) {
  await isAdmin()

  const newUser = await db.insert(user).values({
    id: crypto.randomUUID(),
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
  }).returning()

  if (!newUser[0]) throw new Error('Failed to create user')

  await db.insert(userRole).values({
    userId: newUser[0].id,
    role: 'parent',
  })

  const newParent = await db.insert(parentTable).values({
    userId: newUser[0].id,
    parentId: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    relationship: data.relationship,
  }).returning()

  return newParent[0]
}

// Admin Statistics
export async function getAdminDashboardStats() {
  await isAdmin()

  const totalStudents = await db.query.student.findMany().then(s => s.length)
  const totalTeachers = await db.query.teacher.findMany().then(t => t.length)
  const totalParents = await db.query.parent.findMany().then(p => p.length)

  return {
    totalStudents,
    totalTeachers,
    totalParents,
    totalUsers: totalStudents + totalTeachers + totalParents,
  }
}
