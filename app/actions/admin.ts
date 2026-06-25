'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, student, teacher, parent as parentTable, userRole, academicSession, term, class_ } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'
import { randomUUID } from 'crypto'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserRoleData(userId: string) {
  return await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
}

async function checkAdminPermission(action: any, resource: any) {
  const userId = await getUserId()
  const role = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    role?.role || '',
    action,
    resource
  )

  if (!hasPermission) throw new Error('Permission denied')
  return true
}

// Session & Term Management
export async function createAcademicSession(name: string, startDate: Date, endDate: Date) {
  await checkAdminPermission('create', 'academicSession')
  return db.insert(academicSession).values({
    id: randomUUID(),
    name,
    startDate,
    endDate,
    isCurrent: true,
  }).returning()
}

export async function createTerm(sessionId: string, name: string, startDate: Date, endDate: Date) {
  await checkAdminPermission('create', 'term')
  return db.insert(term).values({
    id: randomUUID(),
    sessionId,
    name,
    startDate,
    endDate,
    isCurrent: true,
  }).returning()
}

// Student Management
export async function getAllStudents() {
  await checkAdminPermission('read', 'student')
  return db.query.student.findMany({
    with: {
      user: true,
    },
  })
}

export async function getStudent(studentId: string) {
  await checkAdminPermission('read', 'student')
  return db.query.student.findFirst({
    where: eq(student.id, studentId),
    with: {
      user: true,
    },
  })
}

// Keep the name as expected by the UI
export async function createStudent(data: any) {
  await checkAdminPermission('create', 'student')
  // Note: In Supabase, usually the user signs up themselves.
  // This is a placeholder profile creation.
  return await db.transaction(async (tx) => {
    const userId = randomUUID() // Placeholder until Supabase Auth user is created
    await tx.insert(userTable).values({ id: userId, email: data.email, name: `${data.firstName} ${data.lastName}` })
    await tx.insert(userRole).values({ id: randomUUID(), userId: userId, role: 'STUDENT' })
    const newStudent = await tx.insert(student).values({
      id: randomUUID(),
      userId: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      class: data.class,
      admissionNumber: data.admissionNumber,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender
    }).returning()
    revalidatePath('/dashboard/admin/users/students')
    return newStudent[0]
  })
}

export async function updateStudent(studentId: string, data: Partial<{
  firstName: string
  lastName: string
  class: string
  dateOfBirth: string
  gender: string
}>) {
  await checkAdminPermission('update', 'student')

  const updateData: any = { ...data, updatedAt: new Date() }

  const result = await db.update(student)
    .set(updateData)
    .where(eq(student.id, studentId))
    .returning()
  return result[0]
}

export async function promoteStudents(studentIds: string[], targetClass: string) {
  await checkAdminPermission('update', 'student')
  const results = await Promise.all(studentIds.map(id =>
    db.update(student)
      .set({ class: targetClass, updatedAt: new Date() })
      .where(eq(student.id, id))
      .returning()
  ))
  revalidatePath('/dashboard/admin/users/students')
  return results
}

// Alias for UI
export const processBulkPromotion = promoteStudents

// Teacher Management
export async function getAllTeachers() {
  await checkAdminPermission('read', 'teacher')
  return db.query.teacher.findMany({
    with: {
      user: true,
    },
  })
}

export async function createTeacher(data: any) {
  await checkAdminPermission('create', 'teacher')
  return await db.transaction(async (tx) => {
    const userId = randomUUID()
    await tx.insert(userTable).values({ id: userId, email: data.email, name: `${data.firstName} ${data.lastName}` })
    await tx.insert(userRole).values({ id: randomUUID(), userId: userId, role: 'TEACHER' })
    const newTeacher = await tx.insert(teacher).values({
      id: randomUUID(),
      userId: userId,
      staffCode: data.staffCode,
      firstName: data.firstName,
      lastName: data.lastName,
    }).returning()
    revalidatePath('/dashboard/admin/users/teachers')
    return newTeacher[0]
  })
}

// Parent Management
export async function getAllParents() {
  await checkAdminPermission('read', 'parent')
  return db.query.parent.findMany({
    with: {
      user: true,
    },
  })
}

export async function getAdminDashboardStats() {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)
  if (roleData?.role !== 'ADMIN') throw new Error('Permission denied')

  const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(student)
  const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teacher)
  const [parentCount] = await db.select({ count: sql<number>`count(*)` }).from(parentTable)

  const sCount = Number(studentCount?.count ?? 0)
  const tCount = Number(teacherCount?.count ?? 0)
  const pCount = Number(parentCount?.count ?? 0)

  return {
    totalStudents: sCount,
    totalTeachers: tCount,
    totalParents: pCount,
    totalUsers: sCount + tCount + pCount,
  }
}

// Class Management
export async function createClass(data: {
  name: string
  teacherId?: string
}) {
  await checkAdminPermission('create', 'class')
  const result = await db.insert(class_).values({
    id: randomUUID(),
    ...data,
  }).returning()
  revalidatePath('/dashboard/admin/academics/classes')
  return result[0]
}

export async function getAllClasses() {
  await checkAdminPermission('read', 'class')
  return db.query.class_.findMany({
    with: {
      teacher: true
    }
  })
}
