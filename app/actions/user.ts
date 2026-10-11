'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, student, parent as parentTable, teacher as teacherTable, userRole, notification as notificationTable, academicSession, term, payment, school as schoolTable } from '@/lib/db/schema'
import { eq, and, count, desc, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { generateAdmissionNumber, generateStaffId } from '@/lib/id'
import { sendFCMOtp } from '@/lib/services/notifications'

export async function getStudentEmailByAdmissionNumber(admissionNumber: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const child = await db.query.student.findFirst({
    where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase()),
    with: { user: true }
  })
  return child?.userId === session.user.id ? child.user?.email || null : null
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

  const parentSchoolId = parentProfile.schoolId
  if (!parentSchoolId || child.schoolId !== parentSchoolId) {
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
      .where(and(
        eq(student.id, child.id),
        eq(student.schoolId, parentSchoolId),
        isNull(student.parentId),
      ))
      .returning()

    if (updated.length === 0) throw new Error('Child link failed due to concurrent update.')

    revalidatePath('/dashboard/parent/children')
    const studentName = `${updated[0].firstName} ${updated[0].lastName}`
    return { success: true, student: updated[0], name: studentName }
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

export async function checkWardLinkingStatus(admissionNumber: string, schoolCode?: string) {
  const session = await auth.getSession()
  const currentUser = session?.user
    ? await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
    : null
  let targetSchoolId = currentUser?.schoolId || null

  if (schoolCode?.trim()) {
    const matchingSchool = await db.query.school.findFirst({
      where: eq(schoolTable.code, schoolCode.trim().toUpperCase()),
    })
    if (!matchingSchool || (session?.user && session.user.role !== 'SUPER_ADMIN' && matchingSchool.id !== targetSchoolId)) {
      return { found: false, isLinked: false, canLink: false, message: 'Student with this admission number not found' }
    }
    targetSchoolId = matchingSchool.id
  }

  if (!targetSchoolId) {
    return { found: false, isLinked: false, canLink: false, message: 'A valid school registration code is required.' }
  }

  const child = await db.query.student.findFirst({
    where: and(
      eq(student.admissionNumber, admissionNumber.trim().toUpperCase()),
      eq(student.schoolId, targetSchoolId),
    ),
  })

  if (!child) return { found: false, isLinked: false, canLink: false, message: 'Student with this admission number not found' }
  const studentSummary = {
    admissionNumber: child.admissionNumber,
    firstName: child.firstName,
    lastName: child.lastName,
    class: child.class,
  }
  if (child.parentId) return { found: true, isLinked: true, canLink: false, message: 'Student is already linked to a parent account', studentName: `${child.firstName} ${child.lastName}`, studentClass: child.class }

  return { found: true, isLinked: false, canLink: true, student: studentSummary, studentName: `${child.firstName} ${child.lastName}`, studentClass: child.class }
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
  if (targetUserId !== session.user.id && session.user.role !== 'SUPER_ADMIN') return null

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
  occupation?: string
  profileImage?: string
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
      occupation: data.occupation || parentProfile.occupation,
      profileImage: data.profileImage || parentProfile.profileImage,
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
  if (targetUserId !== session.user.id && session.user.role !== 'SUPER_ADMIN') return null

  return db.query.student.findFirst({
    where: eq(student.userId, targetUserId),
    with: { user: true }
  })
}

export async function getTeacherProfile(userId?: string) {
  const session = await auth.getSession()
  if (!session?.user) return null
  const targetUserId = userId || session.user.id
  if (targetUserId !== session.user.id && session.user.role !== 'SUPER_ADMIN') return null

  return db.query.teacher.findFirst({
    where: eq(teacherTable.userId, targetUserId),
    with: { user: true }
  })
}

export async function getUserRole(userId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized session')
  if (userId !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: You can only read your own role.')
  }

  const roleRec = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId)
  })
  return roleRec?.role || 'STUDENT'
}

export async function createParentProfile(data: any) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await db.insert(userRole).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    role: 'PARENT',
    createdAt: new Date(),
  }).onConflictDoNothing()

  const existing = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id)
  })

  if (existing) return existing

  const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  const targetSchoolId = userRecord?.schoolId || null
  if (!targetSchoolId) {
    throw new Error('A verified school registration is required before creating a parent profile.')
  }

  const inserted = await db.insert(parentTable).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    schoolId: targetSchoolId,
    firstName: data.firstName || session.user.name?.split(' ')[0] || 'Parent',
    lastName: data.lastName || session.user.name?.split(' ')[1] || 'Guardian',
    phoneNumber: data.phoneNumber || null,
  }).returning()

  return inserted[0]
}

export async function createStudentProfile(data: any) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await db.insert(userRole).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    role: 'STUDENT',
    createdAt: new Date(),
  }).onConflictDoNothing()

  const existing = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id)
  })

  if (existing) return existing

  const targetClass = data.class || 'JSS1'
  const targetSchoolId = data.schoolId || session.user.schoolId || null

  const inserted = await db.insert(student).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    schoolId: targetSchoolId,
    firstName: data.firstName || session.user.name?.split(' ')[0] || 'Student',
    lastName: data.lastName || session.user.name?.split(' ')[1] || 'Pupil',
    class: targetClass,
    admissionNumber: data.admissionNumber || generateAdmissionNumber(targetClass),
  }).returning()

  return inserted[0]
}

export async function createTeacherProfile(data: any) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await db.insert(userRole).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    role: 'TEACHER',
    createdAt: new Date(),
  }).onConflictDoNothing()

  const existing = await db.query.teacher.findFirst({
    where: eq(teacherTable.userId, session.user.id)
  })

  if (existing) return existing

  const targetSchoolId = data.schoolId || session.user.schoolId || null

  const inserted = await db.insert(teacherTable).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    schoolId: targetSchoolId,
    firstName: data.firstName || session.user.name?.split(' ')[0] || 'Teacher',
    lastName: data.lastName || session.user.name?.split(' ')[1] || 'Staff',
    staffCode: generateStaffId(),
  }).returning()

  return inserted[0]
}

export async function updateStudentProfileSettingsAction(data: {
  fullName?: string
  firstName?: string
  lastName?: string
  phone?: string
  gender?: string
}) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') {
    throw new Error('Unauthorized')
  }

  const studentRec = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id)
  })

  if (studentRec && (data.firstName || data.lastName)) {
    await db.update(student)
      .set({
        firstName: data.firstName || studentRec.firstName,
        lastName: data.lastName || studentRec.lastName,
        gender: data.gender || studentRec.gender,
        updatedAt: new Date()
      })
      .where(eq(student.id, studentRec.id))
  }

  const nameVal = data.fullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : undefined)

  await db.update(userTable)
    .set({
      name: nameVal || undefined,
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

  const userRec = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
  })

  // Enforce 3-day minimum interval between password changes
  if (userRec?.updatedAt) {
    const lastChange = new Date(userRec.updatedAt).getTime()
    const now = Date.now()
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000
    if (now - lastChange < threeDaysMs) {
      const remainingDays = Math.ceil((threeDaysMs - (now - lastChange)) / (24 * 60 * 60 * 1000))
      throw new Error(`Password can only be changed once every 3 days. Please try again in ${remainingDays} day(s).`)
    }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

  if (updateError) {
    throw new Error(updateError.message)
  }

  await db.update(userTable).set({ updatedAt: new Date() }).where(eq(userTable.id, session.user.id))

  // Transmit FCM OTP alert to the student's registered device informing of password change
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
  try {
    await sendFCMOtp({
      userId: session.user.id,
      title: 'Security Alert: Password Changed',
      otpCode: generatedOtp,
      type: 'CHANGE_PASSWORD',
    })
  } catch (err) {
    console.warn('FCM OTP dispatch for password change encountered non-fatal error:', err)
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
