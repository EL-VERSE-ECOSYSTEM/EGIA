'use server'

import { db } from '@/lib/db'
import { school, user, userRole, student, teacher, parent, assessment, message, notification, adultEducationEnrollment, schoolRegistrationApplication, schoolAdminRoles, auditLog } from '@/lib/db/schema'
import { eq, sql, desc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { randomUUID } from 'crypto'

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
  const requestId = randomUUID()
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
    console.error('Failed to get Super Admin stats:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to retrieve system statistics. Please try again.', requestId }
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
  const requestId = randomUUID()
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
    console.error('Failed to award student gift:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to award student gift. Please try again.', requestId }
  }
}

export async function toggleUserSuspensionAction(userId: string, suspend: boolean, reason?: string) {
  const requestId = randomUUID()
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
    console.error('Failed to toggle user suspension:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to update account suspension status. Please try again.', requestId }
  }
}

export async function recordDisciplinaryAction(data: {
  userId: string
  title: string
  description: string
  actionType: 'WARNING' | 'SUSPENSION' | 'PROBATION' | 'EXPULSION'
}) {
  const requestId = randomUUID()
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
    console.error('Failed to record disciplinary action:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to record disciplinary action. Please try again.', requestId }
  }
}

export async function toggleSchoolParentRegistrationAction(schoolId: string, allowParents: boolean) {
  const requestId = randomUUID()
  try {
    await checkSuperAdminPermission()

    await db.update(school)
      .set({ allowParents, updatedAt: new Date() })
      .where(eq(school.id, schoolId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to toggle school parent registration:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to update school registration settings. Please try again.', requestId }
  }
}

export async function updateSchoolPaymentStatusAction(schoolId: string, status: 'PAID' | 'PENDING') {
  const requestId = randomUUID()
  try {
    await checkSuperAdminPermission()

    await db.update(school)
      .set({ paymentStatus: status, updatedAt: new Date() })
      .where(eq(school.id, schoolId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to update school payment status:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to update school payment status. Please try again.', requestId }
  }
}

export async function sendSystemWideNotificationAction(input: {
  title: string
  message: string
  targetSchoolId?: string
  targetRole?: string
}) {
  const requestId = randomUUID()
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
    console.error('Failed to send system-wide notification:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to broadcast system notifications. Please try again.', requestId }
  }
}

export async function getAllUsersForSuperAdmin() {
  const requestId = randomUUID()
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
    console.error('Failed to retrieve super-admin users list:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to fetch users list. Please try again.', requestId }
  }
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  const requestId = randomUUID()
  try {
    await checkSuperAdminPermission()

    await db.update(userRole)
      .set({ role: newRole })
      .where(eq(userRole.userId, userId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to update user role:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to update user role. Please try again.', requestId }
  }
}

export async function deleteUserAccountAction(userId: string) {
  const requestId = randomUUID()
  try {
    await checkSuperAdminPermission()

    await db.delete(user).where(eq(user.id, userId))
    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete user account:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to delete user account. Please try again.', requestId }
  }
}

export async function getAllCBTsForSuperAdmin() {
  const requestId = randomUUID()
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
    console.error('Failed to fetch super-admin CBTs:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to retrieve CBT assessments. Please try again.', requestId }
  }
}

export async function getPendingSchoolApplicationsAction() {
  const requestId = randomUUID()
  try {
    await checkSuperAdminPermission()

    const applications = await db.query.schoolRegistrationApplication.findMany({
      orderBy: (app, { desc }) => [desc(app.submittedAt)],
    })

    return { success: true, applications }
  } catch (error: any) {
    console.error('Failed to retrieve pending school applications:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to fetch school applications queue.', requestId }
  }
}

export async function reviewSchoolApplicationAction(input: {
  applicationId: string
  documentStatus?: 'VERIFIED' | 'REJECTED'
  approvalStatus?: 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  rejectionReason?: string
}) {
  const requestId = randomUUID()
  try {
    const adminUser = await checkSuperAdminPermission()

    const appRecord = await db.query.schoolRegistrationApplication.findFirst({
      where: eq(schoolRegistrationApplication.id, input.applicationId)
    })

    if (!appRecord) {
      return { success: false, error: 'School application not found.' }
    }

    await db.update(schoolRegistrationApplication)
      .set({
        documentVerificationStatus: input.documentStatus || appRecord.documentVerificationStatus,
        approvalStatus: input.approvalStatus || appRecord.approvalStatus,
        rejectionReason: input.rejectionReason || appRecord.rejectionReason,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schoolRegistrationApplication.id, input.applicationId))

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to review school application:', { requestId, error: error?.message || error })
    return { success: false, error: 'Failed to update application review state.', requestId }
  }
}

export async function activateSchoolAdminAction(applicationId: string) {
  const requestId = randomUUID()
  try {
    const adminUser = await checkSuperAdminPermission()

    const appRecord = await db.query.schoolRegistrationApplication.findFirst({
      where: eq(schoolRegistrationApplication.id, applicationId)
    })

    if (!appRecord) {
      return { success: false, error: 'School application not found.' }
    }

    // Recommended approval rule enforcement
    if (appRecord.paymentStatus !== 'SUCCESS') {
      return { success: false, error: 'Cannot activate school: Korapay payment status must be SUCCESS.' }
    }
    if (appRecord.documentVerificationStatus !== 'VERIFIED') {
      return { success: false, error: 'Cannot activate school: Proof of address document must be VERIFIED.' }
    }
    if (appRecord.approvalStatus !== 'APPROVED') {
      return { success: false, error: 'Cannot activate school: Approval status must be APPROVED.' }
    }

    const applicantEmail = appRecord.applicantEmail.trim().toLowerCase()
    let finalUserId: string = randomUUID()

    // 1. Create or locate Supabase Auth user (handling existing user safely)
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (secretKey) {
      const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
      const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Check existing user by email
      const { data: existingList } = await supabaseAdmin.auth.admin.listUsers()
      const existingAuthUser = existingList?.users?.find(u => u.email?.toLowerCase() === applicantEmail)

      if (existingAuthUser) {
        // Prevent existing account takeover: do NOT overwrite password or global metadata
        finalUserId = existingAuthUser.id
      } else {
        const createRes = await supabaseAdmin.auth.admin.createUser({
          id: finalUserId,
          email: applicantEmail,
          email_confirm: true,
          user_metadata: {
            full_name: appRecord.applicantName,
            role: 'SCHOOL_ADMIN',
            school_id: appRecord.schoolId,
          }
        })
        if (createRes.data?.user?.id) {
          finalUserId = createRes.data.user.id
        }

        // Send invitation / password setup link
        try {
          await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: applicantEmail,
          })
        } catch (linkErr) {
          console.warn('Could not generate password setup link:', linkErr)
        }
      }
    }

    await db.transaction(async (tx) => {
      // 2. Create or ensure application user record exists
      await tx.insert(user).values({
        id: finalUserId,
        email: applicantEmail,
        name: appRecord.applicantName,
        schoolId: appRecord.schoolId,
        adminLevel: appRecord.adminLevel || 'PRIMARY_ADMIN',
        lastIdentityId: appRecord.schoolId,
        lastIdentityAt: new Date(),
      }).onConflictDoNothing()

      // 3. Create global user_role record
      await tx.insert(userRole).values({
        id: randomUUID(),
        userId: finalUserId,
        role: 'SCHOOL_ADMIN',
      }).onConflictDoNothing()

      // 4. Create active school_admin_roles record
      if (appRecord.schoolId) {
        await tx.insert(schoolAdminRoles).values({
          id: randomUUID(),
          schoolId: appRecord.schoolId,
          userId: finalUserId,
          level: appRecord.adminLevel || 'PRIMARY_ADMIN',
          isActive: true,
          approvedBy: adminUser.id,
          approvedAt: new Date(),
        }).onConflictDoUpdate({
          target: [schoolAdminRoles.schoolId, schoolAdminRoles.userId],
          set: {
            isActive: true,
            approvedBy: adminUser.id,
            approvedAt: new Date(),
          }
        })

        // Activate school record
        await tx.update(school)
          .set({ paymentStatus: 'PAID', updatedAt: new Date() })
          .where(eq(school.id, appRecord.schoolId))
      }

      // 5. Record approval in audit_log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        userId: adminUser.id,
        action: 'APPROVE_SCHOOL_ADMIN',
        resource: 'school_registration_application',
        resourceId: applicationId,
        details: {
          applicantEmail,
          schoolId: appRecord.schoolId,
          activatedAdminUserId: finalUserId,
        },
        createdAt: new Date(),
      })
    })

    revalidatePath('/dashboard/super-admin/overview')
    return { success: true, activatedUserId: finalUserId }
  } catch (error: any) {
    console.error('Failed to activate school admin:', { requestId, error: error?.message || error })
    return { success: false, error: 'School admin activation failed. Please check logs and try again.', requestId }
  }
}

export async function approveCBTAssessmentAction(assessmentId: string, approved: boolean, comment?: string) {
  const requestId = randomUUID()
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
    console.error('Failed to approve/reject CBT assessment:', { requestId, error: error?.message || error })
    return { success: false, error: 'Unable to update assessment status. Please try again.', requestId }
  }
}
