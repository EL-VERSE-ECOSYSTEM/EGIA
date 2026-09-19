'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, student, parent as parentTable, teacher as teacherTable, userRole, notification as notificationTable, academicSession, term, payment } from '@/lib/db/schema'
import { eq, and, count, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getStudentEmailByAdmissionNumber(admissionNumber: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const child = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase()),
    with: { user: true }
  })
  return child?.user?.email || null
}

export async function linkChild(admissionNumber: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'PARENT') {
    throw new Error('Unauthorized: Only registered parents can link children.')
  }

  const parentProfile = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id)
  })

  if (!parentProfile) throw new Error('Parent profile not found')

  const child = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase())
  })

  if (!child) throw new Error('Student with this admission number not found')

  if (parentProfile.schoolId && child.schoolId && parentProfile.schoolId !== child.schoolId) {
    throw new Error('You can only link students registered under your school.')
  }

  if (child.parentId) throw new Error('This student is already linked to a parent account')

  return await db.transaction(async (tx) => {
    const linkedCount = await tx.select({ value: count() }).from(student).where(eq(student.parentId, parentProfile.id))
    if ((linkedCount[0]?.value || 0) >= 5) throw new Error('A parent account can be linked to a maximum of 5 children.')

    const currentSession = await tx.query.academicSession.findFirst({
      where: eq(academicSession.isCurrent, true)
    })
    const currentTerm = await tx.query.term.findFirst({
      where: eq(term.isCurrent, true)
    })

    const updated = await tx.update(student)
      .set({
        parentId: parentProfile.id,
        termId: currentTerm?.id || child.termId || null,
        sessionId: currentSession?.id || child.sessionId || null,
        updatedAt: new Date()
      })
      .where(and(eq(student.id, child.id), eq(student.parentId, null as any)))
      .returning()

    if (updated.length === 0) throw new Error('Child link failed due to concurrent update.')

    revalidatePath('/dashboard/parent/children')
    return { success: true, student: updated[0] }
  })
}

export async function getLinkedChildren() {
  const session = await auth.getSession()
  if (!session?.user) return []

  const parentProfile = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id)
  })

  if (!parentProfile) return []

  return await db.query.student.findMany({
    where: eq(student.parentId, parentProfile.id)
  })
}

export async function checkWardLinkingStatus(admissionNumber: string) {
  const session = await auth.getSession()
  if (!session?.user) return { isLinked: false, canLink: false }

  const child = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase())
  })

  if (!child) return { isLinked: false, canLink: false, error: 'Student not found' }
  if (child.parentId) return { isLinked: true, canLink: false, error: 'Already linked to a parent' }

  return { isLinked: false, canLink: true, student: child }
}

export async function createAdminProfile() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Only SUPER_ADMIN can invoke administrative profile creation.')
  }

  return { success: true }
}

export async function getParentProfile(userId?: string) {
  const session = await auth.getSession()
  if (!session?.user) return null
  const targetUserId = userId || session.user.id

  return db.query.parent.findFirst({
    where: eq(parentTable.userId, targetUserId),
    with: { user: true }
  })
}

export async function updateParentProfile(data: {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  address?: string
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const parentProfile = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id)
  })
  if (!parentProfile) throw new Error('Parent profile not found')

  await db.update(parentTable)
    .set({
      firstName: data.firstName || parentProfile.firstName,
      lastName: data.lastName || parentProfile.lastName,
      phoneNumber: data.phoneNumber || parentProfile.phoneNumber,
      address: data.address || parentProfile.address,
      updatedAt: new Date(),
    })
    .where(eq(parentTable.id, parentProfile.id))

  revalidatePath('/dashboard/parent/settings/profile')
  return { success: true }
}

export async function getStudentProfile(userId?: string) {
  const session = await auth.getSession()
  if (!session?.user) return null
  const targetUserId = userId || session.user.id

  return db.query.student.findFirst({
    where: eq(student.userId, targetUserId),
    with: { user: true }
  })
}

export async function getTeacherProfile(userId?: string) {
  const session = await auth.getSession()
  if (!session?.user) return null
  const targetUserId = userId || session.user.id

  return db.query.teacher.findFirst({
    where: eq(teacherTable.userId, targetUserId),
    with: { user: true }
  })
}

export async function getUserRole(userId: string) {
  const roleRec = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId)
  })
  return roleRec?.role || 'STUDENT'
}

export async function createParentProfile(data: any) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const existing = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id)
  })

  if (existing) return existing

  const inserted = await db.insert(parentTable).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    schoolId: session.user.schoolId || null,
    firstName: data.firstName || session.user.name?.split(' ')[0] || 'Parent',
    lastName: data.lastName || session.user.name?.split(' ')[1] || 'Guardian',
    phoneNumber: data.phoneNumber || null,
  }).returning()

  return inserted[0]
}

export async function createStudentProfile(data: any) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const existing = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id)
  })

  if (existing) return existing

  const inserted = await db.insert(student).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    schoolId: session.user.schoolId || null,
    firstName: data.firstName || session.user.name?.split(' ')[0] || 'Student',
    lastName: data.lastName || session.user.name?.split(' ')[1] || 'Pupil',
    class: data.class || 'JSS1',
    admissionNumber: data.admissionNumber || `STU-${Math.floor(10000 + Math.random() * 90000)}`,
  }).returning()

  return inserted[0]
}

export async function createTeacherProfile(data: any) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const existing = await db.query.teacher.findFirst({
    where: eq(teacherTable.userId, session.user.id)
  })

  if (existing) return existing

  const inserted = await db.insert(teacherTable).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    schoolId: session.user.schoolId || null,
    firstName: data.firstName || session.user.name?.split(' ')[0] || 'Teacher',
    lastName: data.lastName || session.user.name?.split(' ')[1] || 'Staff',
    staffCode: `ST-${Math.floor(10000 + Math.random() * 90000)}`,
  }).returning()

  return inserted[0]
}

export async function updateStudentProfileSettingsAction(data: {
  fullName?: string
  phone?: string
  gender?: string
}) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') {
    throw new Error('Unauthorized')
  }

  await db.update(userTable)
    .set({
      name: data.fullName || undefined,
      gender: data.gender || undefined,
      updatedAt: new Date()
    })
    .where(eq(userTable.id, session.user.id))

  revalidatePath('/dashboard/student/profile')
  return { success: true }
}

export async function getLoggedInNotifications() {
  const session = await auth.getSession()
  if (!session?.user) return []

  return db.query.notification.findMany({
    where: eq(notificationTable.userId, session.user.id),
    orderBy: [desc(notificationTable.createdAt)]
  })
}

export async function updateStudentPassword(newPassword: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') {
    throw new Error('Unauthorized')
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.')
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

  if (updateError) {
    throw new Error(updateError.message)
  }

  return { success: true }
}

export async function deleteUserAccount() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  await supabase.auth.signOut()
  return { success: true }
}
