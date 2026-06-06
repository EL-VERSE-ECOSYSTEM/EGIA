'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, student, teacher, parent as parentTable, userRole, academicSession, term, class_ } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function isAdmin() {
  const userId = await getUserId()
  const roleData = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
  if (roleData?.role !== 'admin') throw new Error('Admin access required')
  return true
}

// Session & Term Management
export async function createAcademicSession(name: string, startDate: Date, endDate: Date) {
  await isAdmin()
  return db.insert(academicSession).values({
    id: crypto.randomUUID(),
    name,
    startDate,
    endDate,
    isActive: true,
  }).returning()
}

export async function createTerm(sessionId: string, name: string, startDate: Date, endDate: Date) {
  await isAdmin()
  return db.insert(term).values({
    id: crypto.randomUUID(),
    sessionId,
    name,
    startDate,
    endDate,
    isActive: true,
  }).returning()
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

  const newUser = await db.insert(user).values({
    id: crypto.randomUUID(),
    email: data.email,
    name: `${data.firstName} ${data.lastName}`,
  }).returning()

  if (!newUser[0]) throw new Error('Failed to create user')

  await db.insert(userRole).values({
    userId: newUser[0].id,
    role: 'student',
  })

  const newStudent = await db.insert(student).values({
    id: crypto.randomUUID(),
    userId: newUser[0].id,
    studentId: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    class: data.class,
    admissionNumber: data.admissionNumber,
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
    .set({ ...data, updatedAt: new Date() })
    .where(eq(student.id, studentId))
    .returning()
  return result[0]
}

export async function promoteStudents(studentIds: string[], targetClass: string) {
  await isAdmin()
  const results = await Promise.all(studentIds.map(id =>
    db.update(student)
      .set({ class: targetClass, updatedAt: new Date() })
      .where(eq(student.id, id))
      .returning()
  ))
  revalidatePath('/dashboard/admin/users/students')
  return results
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
    userId: newUser[0].id,
    parentId: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    relationship: data.relationship,
  }).returning()
  return newParent[0]
}

// Dashboard Metrics
export async function getAdminDashboardStats() {
  await isAdmin()
  const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(student)
  const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teacher)
  const [parentCount] = await db.select({ count: sql<number>`count(*)` }).from(parentTable)
  return {
    totalStudents: studentCount.count,
    totalTeachers: teacherCount.count,
    totalParents: parentCount.count,
    totalUsers: studentCount.count + teacherCount.count + parentCount.count,
  }
}
