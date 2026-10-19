'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherSalaryDeductions, teacherWallet, schoolAdminRoles, teacher, auditLog } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

async function checkPrimaryAdmin(userId: string, role: string) {
  if (role === 'SUPER_ADMIN') return true
  const adminRole = await db.query.schoolAdminRoles.findFirst({
    where: and(
      eq(schoolAdminRoles.userId, userId),
      eq(schoolAdminRoles.isActive, true)
    )
  })
  if (adminRole?.level !== 'PRIMARY_ADMIN') {
    throw new Error('Only Primary Admin can perform payroll & deduction management')
  }
  return true
}

export async function computeMonthlyDeductionsAction(schoolId: string, month: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await checkPrimaryAdmin(session.user.id, session.user.role)

  try {
    await db.execute(sql`
      SELECT public.compute_monthly_deductions(${schoolId}, ${month})
    `)
  } catch (err) {
    console.error('Error computing monthly deductions:', err)
    throw new Error('Failed to compute monthly deductions', { cause: err })
  }

  revalidatePath('/dashboard/admin/payroll/deductions')
  revalidatePath('/dashboard/teacher/payroll')

  return { success: true }
}

export async function reverseDeductionAction(deductionId: string, reason: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  if (!reason || reason.trim().length === 0) {
    throw new Error('A reversal reason is required')
  }

  await checkPrimaryAdmin(session.user.id, session.user.role)

  const now = new Date()

  await db.update(teacherSalaryDeductions)
    .set({
      reversed: true,
      reversedBy: session.user.id,
      reversedAt: now,
      reversalReason: reason,
    })
    .where(eq(teacherSalaryDeductions.id, deductionId))

  await db.insert(auditLog).values({
    id: randomUUID(),
    userId: session.user.id,
    action: 'DEDUCTION_REVERSAL',
    resource: 'teacher_salary_deductions',
    resourceId: deductionId,
    details: { reason } as any,
    createdAt: now,
  })

  revalidatePath('/dashboard/admin/payroll/deductions')
  revalidatePath('/dashboard/teacher/payroll')

  return { success: true }
}

export async function updateTeacherPayConfigAction(teacherId: string, config: {
  dailyRate?: number
  hourlyRate?: number
  latePenaltyPerMinute?: number
  earlyExitPenaltyPerMinute?: number
  absencePenaltyPerDay?: number
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await checkPrimaryAdmin(session.user.id, session.user.role)

  let wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherId)
  })

  if (!wallet) {
    const inserted = await db.insert(teacherWallet).values({
      id: randomUUID(),
      teacherId,
      balance: '0.00',
      salaryAmount: '150000.00',
      dailyRate: (config.dailyRate ?? 0).toString(),
      hourlyRate: (config.hourlyRate ?? 0).toString(),
      latePenaltyPerMinute: (config.latePenaltyPerMinute ?? 0).toString(),
      earlyExitPenaltyPerMinute: (config.earlyExitPenaltyPerMinute ?? 0).toString(),
      absencePenaltyPerDay: (config.absencePenaltyPerDay ?? 0).toString(),
      updatedAt: new Date(),
    }).returning()
    wallet = inserted[0]
  } else {
    await db.update(teacherWallet)
      .set({
        dailyRate: config.dailyRate !== undefined ? config.dailyRate.toString() : wallet.dailyRate,
        hourlyRate: config.hourlyRate !== undefined ? config.hourlyRate.toString() : wallet.hourlyRate,
        latePenaltyPerMinute: config.latePenaltyPerMinute !== undefined ? config.latePenaltyPerMinute.toString() : wallet.latePenaltyPerMinute,
        earlyExitPenaltyPerMinute: config.earlyExitPenaltyPerMinute !== undefined ? config.earlyExitPenaltyPerMinute.toString() : wallet.earlyExitPenaltyPerMinute,
        absencePenaltyPerDay: config.absencePenaltyPerDay !== undefined ? config.absencePenaltyPerDay.toString() : wallet.absencePenaltyPerDay,
        updatedAt: new Date(),
      })
      .where(eq(teacherWallet.id, wallet.id))
  }

  revalidatePath('/dashboard/admin/payroll/deductions')

  return { success: true }
}

export async function getSalaryDeductionsAction(schoolId: string, month: string, teacherId?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const list = await db.query.teacherSalaryDeductions.findMany({
    where: teacherId
      ? and(
          eq(teacherSalaryDeductions.schoolId, schoolId),
          eq(teacherSalaryDeductions.month, month),
          eq(teacherSalaryDeductions.teacherId, teacherId)
        )
      : and(
          eq(teacherSalaryDeductions.schoolId, schoolId),
          eq(teacherSalaryDeductions.month, month)
        ),
    orderBy: [desc(teacherSalaryDeductions.createdAt)],
  })

  // Attach teacher info
  const results: Array<any> = []
  for (const item of list) {
    const t = await db.query.teacher.findFirst({
      where: eq(teacher.id, item.teacherId)
    })
    results.push({
      ...item,
      amount: parseFloat(item.amount),
      teacher: t ? {
        id: t.id,
        firstname: t.firstName,
        lastname: t.lastName,
        staffcode: t.staffCode,
      } : undefined
    })
  }

  return results
}
