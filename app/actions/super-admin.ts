'use server'

import { db } from '@/lib/db'
import { school, user, userRole, student, teacher, parent, assessment, message, notification, adultEducationEnrollment } from '@/lib/db/schema'
import { eq, sql, desc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

async function checkSuperAdminPermission() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized: Session required.')

  const roleRecord = await db.query.userRole.findFirst({
    where: and(eq(userRole.userId, session.user.id), eq(userRole.role, 'SUPER_ADMIN'))
  })

  if (!roleRecord && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.')
  }

  return session.user
}

export async function getSuperAdminOverviewStats() {
  try {
    await checkSuperAdminPermission()

    const schoolsList = await db.select().from(school).orderBy(desc(school.createdAt))
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(user)
    const totalStudents = await db.select({ count: sql<number>`count(*)` }).from(student)
    const totalTeachers = await db.select({ count: sql<number>`count(*)` }).from(teacher)
    const totalParents = await db.select({ count: sql<number>`count(*)` }).from(parent)
    const totalCBTS = await db.select({ count: sql<number>`count(*)` }).from(assessment)

    const paidSchools = schoolsList.filter(s => s.paymentStatus === 'PAID')
    const totalSubscriptionRevenue = paidSchools.length * 30000

    return {
      success: true,
      stats: {
        totalSchools: schoolsList.length,
        paidSchoolsCount: paidSchools.length,
        pendingSchoolsCount: schoolsList.length - paidSchools.length,
        totalSubscriptionRevenue,
        totalUsersCount: Number(totalUsers[0]?.count || 0),
        studentsCount: Number(totalStudents[0]?.count || 0),
        teachersCount: Number(totalTeachers[0]?.count || 0),
        parentsCount: Number(totalParents[0]?.count || 0),
        cbtCount: Number(totalCBTS[0]?.count || 0),
      },
      schools: schoolsList
    }
  } catch (error: any) {
    console.error('Failed to get Super Admin stats:', error)
    return { success: false, error: error.message }
  }
}

export async function awardStudentGiftAction(data: {
  studentId: string
  title: string
  reason?: string
  amount: number
  giftType?: 'CASH' | 'FEE_CREDIT' | 'CASH_OR_FEE'
  expirationHours?: number
}) {
  try {
    await checkSuperAdminPermission()

    const studentRecord = await db.query.student.findFirst({
      where: eq(student.id, data.studentId)
    })

    if (!studentRecord) throw new Error('Student record not found.')

    const { studentGifts } = await import('@/lib/db/schema')
    const giftId = `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const expiresAt = new Date(Date.now() + (data.expirationHours || 48) * 60 * 60 * 1000)

    await db.insert(studentGifts).values({
      id: giftId,
      schoolId: studentRecord.schoolId,
      studentId: data.studentId,
      title: data.title,
      reason: data.reason || null,
      amount: data.amount.toFixed(2),
      giftType: data.giftType || 'CASH_OR_FEE',
      status: 'AVAILABLE',
      receivedAt: new Date(),
      expiresAt: expiresAt,
      createdAt: new Date()
    })

    revalidatePath('/dashboard/super-admin')
    revalidatePath('/dashboard/student/leaderboard')
    return { success: true, giftId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleUserSuspensionAction(userId: string, suspend: boolean, reason?: string) {
  try {
    await checkSuperAdminPermission()

    // 1. Update user active status in teacher table
    await db.update(teacher)
      .set({ isActive: !suspend, status: suspend ? 'SUSPENDED' : 'APPROVED', updatedAt: new Date() })
      .where(eq(teacher.userId, userId))

    // 2. Update user active status in student table
    await db.update(student)
      .set({ isActive: !suspend, registrationStatus: suspend ? 'SUSPENDED' : 'ACTIVE', updatedAt: new Date() })
      .where(eq(student.userId, userId))

    revalidatePath('/dashboard/super-admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function recordDisciplinaryAction(data: {
  userId: string
  title: string
  description: string
  actionType: 'WARNING' | 'SUSPENSION' | 'PROBATION' | 'EXPULSION'
}) {
  try {
    await checkSuperAdminPermission()

    // Record system notification for user
    await db.insert(notification).values({
      id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId,
      title: `DISCIPLINARY NOTICE: ${data.actionType}`,
      message: `${data.title}: ${data.description}`,
      type: 'DISCIPLINARY',
      createdAt: new Date()
    })

    if (data.actionType === 'SUSPENSION' || data.actionType === 'EXPULSION') {
      await toggleUserSuspensionAction(data.userId, true, data.description)
    }

    revalidatePath('/dashboard/super-admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleSchoolParentRegistrationAction(schoolId: string, allowParents: boolean) {
  try {
    await checkSuperAdminPermission()

    await db.update(school)
      .set({ allowParents, updatedAt: new Date() })
      .where(eq(school.id, schoolId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateSchoolPaymentStatusAction(schoolId: string, status: 'PAID' | 'PENDING') {
  try {
    await checkSuperAdminPermission()

    await db.update(school)
      .set({ paymentStatus: status, updatedAt: new Date() })
      .where(eq(school.id, schoolId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendSystemWideNotificationAction(input: {
  title: string
  message: string
  targetSchoolId?: string
  targetRole?: string
}) {
  try {
    await checkSuperAdminPermission()

    let targetUsers: { id: string }[] = []

    if (input.targetSchoolId) {
      targetUsers = await db.select({ id: user.id }).from(user).where(eq(user.schoolId, input.targetSchoolId))
    } else {
      targetUsers = await db.select({ id: user.id }).from(user)
    }

    const notificationInserts = targetUsers.map(u => ({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: u.id,
      schoolId: input.targetSchoolId || null,
      title: input.title,
      message: input.message,
      type: 'SYSTEM_BROADCAST',
      createdAt: new Date()
    }))

    if (notificationInserts.length > 0) {
      for (let i = 0; i < notificationInserts.length; i += 500) {
        await db.insert(notification).values(notificationInserts.slice(i, i + 500) as any)
      }
    }

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true, count: notificationInserts.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllUsersForSuperAdmin() {
  try {
    await checkSuperAdminPermission()

    const usersList = await db.query.user.findMany({
      with: {
        school: true,
        userRole: true,
        student: true,
        teacher: true,
        parent: true
      },
      orderBy: (user, { desc }) => [desc(user.createdAt)]
    })

    return { success: true, users: usersList }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    await checkSuperAdminPermission()

    await db.update(userRole)
      .set({ role: newRole })
      .where(eq(userRole.userId, userId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUserAccountAction(userId: string) {
  try {
    await checkSuperAdminPermission()

    await db.delete(user).where(eq(user.id, userId))
    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllCBTsForSuperAdmin() {
  try {
    await checkSuperAdminPermission()

    const cbtsList = await db.query.assessment.findMany({
      with: {
        school: true,
        subject: true,
        questions: true
      },
      orderBy: (assessment, { desc }) => [desc(assessment.createdAt)]
    })

    return { success: true, cbts: cbtsList }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function approveCBTAssessmentAction(assessmentId: string, approved: boolean, comment?: string) {
  try {
    await checkSuperAdminPermission()

    await db.update(assessment)
      .set({
        status: approved ? 'approved' : 'rejected',
        adminComment: comment || null,
        updatedAt: new Date()
      })
      .where(eq(assessment.id, assessmentId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
