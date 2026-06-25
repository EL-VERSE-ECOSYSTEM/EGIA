'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, student, teacher, parent as parentTable, userRole, academicSession, term, class_, account } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'

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
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
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
    id: crypto.randomUUID(),
    name,
    startDate,
    endDate,
    isActive: true,
  }).returning()
}

export async function createTerm(sessionId: string, name: string, startDate: Date, endDate: Date) {
  await checkAdminPermission('create', 'term')
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
  await checkAdminPermission('create', 'student')
  return await db.transaction(async (tx) => {
    const newUser = await tx.insert(user).values({ id: crypto.randomUUID(), email: data.email, name: `${data.firstName} ${data.lastName}` }).returning()
    if (!newUser[0]) throw new Error('Failed to create user')
    await tx.insert(userRole).values({ id: crypto.randomUUID(), userId: newUser[0].id, role: 'student' })
    await tx.insert(account).values({ id: crypto.randomUUID(), userId: newUser[0].id, type: 'credentials', provider: 'credential', providerAccountId: data.email, password: data.password, createdAt: new Date(), updatedAt: new Date() })
    const newStudent = await tx.insert(student).values({ id: crypto.randomUUID(), userId: newUser[0].id, studentId: crypto.randomUUID(), firstName: data.firstName, lastName: data.lastName, class: data.class, admissionNumber: data.admissionNumber, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined, gender: data.gender }).returning()
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
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth)
  }

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

// Teacher Management
export async function getAllTeachers() {
  await checkAdminPermission('read', 'teacher')
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
  await checkAdminPermission('create', 'teacher')
  return await db.transaction(async (tx) => {
    const newUser = await tx.insert(user).values({ id: crypto.randomUUID(), email: data.email, name: `${data.firstName} ${data.lastName}` }).returning()
    if (!newUser[0]) throw new Error('Failed to create user')
    await tx.insert(userRole).values({ id: crypto.randomUUID(), userId: newUser[0].id, role: 'teacher' })
    await tx.insert(account).values({ id: crypto.randomUUID(), userId: newUser[0].id, type: 'credentials', provider: 'credential', providerAccountId: data.email, password: data.password, createdAt: new Date(), updatedAt: new Date() })
    const newTeacher = await tx.insert(teacher).values({ id: crypto.randomUUID(), userId: newUser[0].id, teacherId: crypto.randomUUID(), firstName: data.firstName, lastName: data.lastName, qualification: data.qualification, specialization: data.specialization }).returning()
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

export async function createParent(data: {
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber?: string
  relationship?: string
}) {
  await checkAdminPermission('create', 'parent')
  return await db.transaction(async (tx) => {
    const newUser = await tx.insert(user).values({ id: crypto.randomUUID(), email: data.email, name: `${data.firstName} ${data.lastName}` }).returning()
    if (!newUser[0]) throw new Error('Failed to create user')
    await tx.insert(userRole).values({ id: crypto.randomUUID(), userId: newUser[0].id, role: 'parent' })
    await tx.insert(account).values({ id: crypto.randomUUID(), userId: newUser[0].id, type: 'credentials', provider: 'credential', providerAccountId: data.email, password: data.password, createdAt: new Date(), updatedAt: new Date() })
    const newParent = await tx.insert(parentTable).values({ id: crypto.randomUUID(), userId: newUser[0].id, parentId: crypto.randomUUID(), firstName: data.firstName, lastName: data.lastName, phoneNumber: data.phoneNumber, relationship: data.relationship }).returning()
    revalidatePath('/dashboard/admin/users/parents')
    return newParent[0]
  })
}

export async function getAdminDashboardStats() {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)
  if (roleData?.role !== 'admin') throw new Error('Permission denied')

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
  arm?: string
  department?: string
  teacherId?: string
  capacity?: number
}) {
  await checkAdminPermission('create', 'class')
  const result = await db.insert(class_).values({
    id: crypto.randomUUID(),
    ...data,
    isActive: true,
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

// Bulk Promotion Logic with Criteria
export async function processBulkPromotion(studentIds: string[], targetClass: string) {
    await checkAdminPermission('update', 'student')

    const results = await db.transaction(async (tx) => {
        return await Promise.all(studentIds.map(id =>
            tx.update(student)
                .set({ class: targetClass, updatedAt: new Date() })
                .where(eq(student.id, id))
                .returning()
        ))
    })

    revalidatePath('/dashboard/admin/users/students')
    return results
}
