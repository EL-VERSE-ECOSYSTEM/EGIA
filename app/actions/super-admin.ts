'use server'

import { db } from '@/lib/db'
import { school, user, userRole, student, teacher, parent, assessment, message, notification, adultEducationEnrollment } from '@/lib/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getSuperAdminOverviewStats() {
  try {
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

export async function toggleSchoolParentRegistrationAction(schoolId: string, allowParents: boolean) {
  try {
    await db.update(school)
      .set({ allowParents, updatedAt: new Date() })
      .where(eq(school.id, schoolId))

    revalidatePath('/dashboard/super-admin/schools')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateSchoolPaymentStatusAction(schoolId: string, status: 'PAID' | 'PENDING') {
  try {
    await db.update(school)
      .set({ paymentStatus: status, updatedAt: new Date() })
      .where(eq(school.id, schoolId))

    revalidatePath('/dashboard/super-admin/schools')
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
      // Chunk inserts in batches of 500
      for (let i = 0; i < notificationInserts.length; i += 500) {
        await db.insert(notification).values(notificationInserts.slice(i, i + 500) as any)
      }
    }

    revalidatePath('/dashboard/super-admin/notifications')
    return { success: true, count: notificationInserts.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllUsersForSuperAdmin() {
  try {
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

export async function approveCBTAssessmentAction(assessmentId: string, approved: boolean, comment?: string) {
  try {
    await db.update(assessment)
      .set({
        status: approved ? 'approved' : 'rejected',
        adminComment: comment || null,
        updatedAt: new Date()
      })
      .where(eq(assessment.id, assessmentId))

    revalidatePath('/dashboard/super-admin/cbt')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
