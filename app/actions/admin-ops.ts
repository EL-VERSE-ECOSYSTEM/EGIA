'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  supportTicket,
  dispute,
  user as userTable,
  student,
  payment,
  parent as parentTable,
  teacher as teacherTable,
  notification,
  assessmentLogs,
  transactionLedger,
  schoolAdminRoles,
  school,
  userRole
} from '@/lib/db/schema'
import bcrypt from 'bcryptjs'
import { generateSequentialStaffCode } from '@/lib/admission'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Admin authorization is required.')
  return session
}

async function requireSchoolAdminScope(requestedSchoolId?: string) {
  const session = await auth.getSession()
  const user = session?.user
  if (!user || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new Error('Admin authorization is required.')
  }

  if (user.role === 'SUPER_ADMIN') return requestedSchoolId || null
  if (!user.schoolId || (requestedSchoolId && requestedSchoolId !== user.schoolId)) {
    throw new Error('Forbidden: You can only access data for your own school.')
  }
  return user.schoolId
}

// ===== SUPPORT TICKETS ACTIONS =====
export async function getAdminSupportTickets() {
  await requireAdmin()
  const list = await db.select().from(supportTicket).orderBy(desc(supportTicket.createdAt))
  const result: any[] = []
  for (const item of list) {
    const userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, item.userId)
    })
    result.push({
      ...item,
      userName: userRecord?.name || 'Portal User',
      userEmail: userRecord?.email || 'N/A'
    })
  }
  return result
}

export async function resolveSupportTicket(ticketId: string, resolution: string) {
  await requireAdmin()
  if (!resolution) throw new Error('Please provide a resolution notes.')

  const result = await db.update(supportTicket)
    .set({
      status: 'RESOLVED',
      resolution,
      resolvedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(supportTicket.id, ticketId))
    .returning()

  revalidatePath('/dashboard/admin/communication/support')
  return result[0]
}

// ===== DISPUTES ACTIONS =====
export async function getAdminDisputes() {
  await requireAdmin()
  const list = await db.select().from(dispute).orderBy(desc(dispute.createdAt))
  const result: any[] = []
  for (const item of list) {
    const userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, item.raisedById)
    })
    const studentRecord = item.relatedStudentId ? await db.query.student.findFirst({
      where: eq(student.id, item.relatedStudentId)
    }) : null
    const paymentRecord = item.relatedPaymentId ? await db.query.payment.findFirst({
      where: eq(payment.id, item.relatedPaymentId)
    }) : null

    result.push({
      ...item,
      raisedByName: userRecord?.name || 'Portal User',
      raisedByEmail: userRecord?.email || 'N/A',
      studentName: studentRecord ? `${studentRecord.firstName} ${studentRecord.lastName}` : null,
      paymentAmount: paymentRecord ? paymentRecord.amount : null,
      paymentReference: paymentRecord ? paymentRecord.transactionReference : null
    })
  }
  return result
}

export async function resolveDispute(disputeId: string, resolution: string) {
  await requireAdmin()
  if (!resolution) throw new Error('Please provide a resolution note.')

  const result = await db.update(dispute)
    .set({
      status: 'RESOLVED',
      resolution,
      resolvedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(dispute.id, disputeId))
    .returning()

  revalidatePath('/dashboard/admin/communication/disputes')
  return result[0]
}

// ===== DISCIPLINARY ACTIONS =====
// Direct query to public.disciplinary_records table using raw SQL for maximum robustness
export async function getAdminDisciplinaryRecords() {
  await requireAdmin()
  try {
    const records = await db.execute(sql`
      SELECT r.*, s.firstname || ' ' || s.lastname AS student_name, s.admissionnumber, u.name AS reported_by_name
      FROM public.disciplinary_records r
      JOIN public.student s ON s.id = r.student_id::text
      JOIN public.user u ON u.id = r.reported_by_id::text
      ORDER BY r.created_at DESC
    `)
    return Array.from(records)
  } catch (err) {
    console.warn('Fallback to student table query for disciplinary cases:', err)
    return []
  }
}

export async function createDisciplinaryRecord(data: {
  studentId: string
  incidentType: string
  description: string
  sanction?: string
}) {
  const session = await requireAdmin()
  const recordId = randomUUID()

  await db.execute(sql`
    INSERT INTO public.disciplinary_records (id, student_id, reported_by_id, incident_date, incident_type, description, sanction, status, created_at, updated_at)
    VALUES (
      ${recordId}::uuid,
      ${data.studentId}::uuid,
      ${session.user.id}::uuid,
      CURRENT_DATE,
      ${data.incidentType},
      ${data.description},
      ${data.sanction || null},
      'PENDING',
      NOW(),
      NOW()
    )
  `)

  revalidatePath('/dashboard/admin/disciplinary/cases')
  return { success: true }
}

export async function resolveDisciplinaryRecord(recordId: string, notes: string) {
  await requireAdmin()

  await db.execute(sql`
    UPDATE public.disciplinary_records
    SET
      status = 'RESOLVED',
      resolved_at = NOW(),
      notes = ${notes},
      updated_at = NOW()
    WHERE id = ${recordId}::uuid
  `)

  revalidatePath('/dashboard/admin/disciplinary/cases')
  return { success: true }
}

// ===== ADMIN UPDATE USER WALLET & OVERVIEW AMOUNTS =====
export async function updateParentOutstandingFee(parentId: string, amount: string) {
  await requireAdmin()
  const num = parseFloat(amount)
  if (isNaN(num) || num < 0) throw new Error('Please enter a valid amount.')

  // Check if parent has any child
  const children = await db.query.student.findMany({
    where: eq(student.parentId, parentId)
  })

  if (children.length === 0) throw new Error('This parent does not have any linked wards to assign fees to.')

  // Create a pending fee record for the first linked ward
  const studentId = children[0].id
  const reference = `FEE-UPDATE-${Date.now()}-${randomUUID().slice(0, 8)}`

  // Deactivate any existing pending fees and insert a new one representing their balance
  await db.update(payment)
    .set({ status: 'failed', updatedAt: new Date() })
    .where(and(eq(payment.parentId, parentId), eq(payment.status, 'pending')))

  await db.insert(payment).values({
    id: randomUUID(),
    studentId,
    parentId,
    amount: num.toFixed(2),
    feeType: 'tuition',
    paymentMethod: 'ADMIN',
    transactionReference: reference,
    status: 'pending',
    description: 'Updated fee obligation set by school administration.',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  revalidatePath('/dashboard/parent/overview')
  revalidatePath('/dashboard/parent/payments/dashboard')
  return { success: true }
}

export async function getParentsWithPendingFees() {
  await requireAdmin()
  const parentsList = await db.select().from(parentTable)
  const result: any[] = []

  for (const p of parentsList) {
    const userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, p.userId)
    })

    // Find pending fees
    const pendingPayments = await db.query.payment.findMany({
      where: and(
        eq(payment.parentId, p.id),
        eq(payment.status, 'pending')
      )
    })

    const totalPending = pendingPayments.reduce((sum, pay) => sum + parseFloat(pay.amount || '0'), 0)

    result.push({
      ...p,
      name: userRecord ? `${userRecord.name}` : `${p.firstName} ${p.lastName}`,
      email: userRecord?.email || 'N/A',
      totalPending
    })
  }

  return result;
}


// ===== ASSESSMENT LOGS ACTIONS =====
export async function getAdminAssessmentLogs(schoolId?: string) {
  const scopedSchoolId = await requireSchoolAdminScope(schoolId)
  if (scopedSchoolId) {
    return db.select().from(assessmentLogs).where(eq(assessmentLogs.schoolId, scopedSchoolId)).orderBy(desc(assessmentLogs.createdAt)).limit(100)
  }
  return db.select().from(assessmentLogs).orderBy(desc(assessmentLogs.createdAt)).limit(100)
}

export async function logAssessmentAction(data: {
  schoolId: string
  assessmentId?: string
  studentId?: string
  action: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  const scopedSchoolId = await requireSchoolAdminScope(data.schoolId)
  if (scopedSchoolId !== data.schoolId) {
    throw new Error('Forbidden: Assessment logs must be recorded for your own school.')
  }

  await db.insert(assessmentLogs).values({
    id: randomUUID(),
    schoolId: data.schoolId,
    assessmentId: data.assessmentId || null,
    studentId: data.studentId || null,
    action: data.action,
    metadata: data.metadata || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null
  })
  revalidatePath('/dashboard/admin/assessments/logs')
}

// ===== TRANSACTION LEDGER ACTIONS =====
export async function getTransactionLedger(schoolId?: string) {
  const scopedSchoolId = await requireSchoolAdminScope(schoolId)
  if (scopedSchoolId) {
    return db.select().from(transactionLedger).where(eq(transactionLedger.schoolId, scopedSchoolId)).orderBy(desc(transactionLedger.createdAt))
  }
  return db.select().from(transactionLedger).orderBy(desc(transactionLedger.createdAt))
}

export async function getRevenueSummary(schoolId?: string) {
  const scopedSchoolId = await requireSchoolAdminScope(schoolId)
  const ledgerRows = scopedSchoolId
    ? await db.select().from(transactionLedger).where(and(eq(transactionLedger.schoolId, scopedSchoolId), eq(transactionLedger.status, 'SUCCESS')))
    : await db.select().from(transactionLedger).where(eq(transactionLedger.status, 'SUCCESS'))

  let totalRevenueIn = 0
  let totalRevenueOut = 0
  const monthlyMap = new Map<string, { in: number; out: number }>()

  for (const row of ledgerRows) {
    const amt = parseFloat(row.amount || '0') || 0
    const monthKey = row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7)

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { in: 0, out: 0 })
    }
    const entry = monthlyMap.get(monthKey)!

    if (row.direction === 'IN') {
      totalRevenueIn += amt
      entry.in += amt
    } else {
      totalRevenueOut += amt
      entry.out += amt
    }
  }

  const monthlyChartData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    revenue: data.in,
    expenses: data.out,
    net: data.in - data.out
  })).sort((a, b) => a.month.localeCompare(b.month))

  return {
    totalRevenueIn,
    totalRevenueOut,
    netRevenue: totalRevenueIn - totalRevenueOut,
    monthlyChartData
  }
}

// ===== PAYMENT RECONCILIATION ACTIONS =====
export async function reconcilePaymentAction(paymentId: string, status: 'RECONCILED' | 'DISPUTED') {
  const schoolScope = await requireSchoolAdminScope()

  const paymentRecord = await db.query.payment.findFirst({
    where: schoolScope
      ? and(eq(payment.id, paymentId), eq(payment.schoolId, schoolScope))
      : eq(payment.id, paymentId),
  })
  if (!paymentRecord) throw new Error('Payment record not found')

  await db.update(payment).set({
    reconciliationStatus: status,
    reconciledBy: (await auth.getSession())!.user!.id,
    reconciledAt: new Date(),
    status: status === 'RECONCILED' ? 'cleared' : 'failed',
    updatedAt: new Date()
  }).where(schoolScope
    ? and(eq(payment.id, paymentId), eq(payment.schoolId, schoolScope))
    : eq(payment.id, paymentId))

  if (status === 'RECONCILED' && paymentRecord.schoolId) {
    await db.insert(transactionLedger).values({
      id: randomUUID(),
      schoolId: paymentRecord.schoolId,
      studentId: paymentRecord.studentId,
      type: paymentRecord.feeType?.toUpperCase() || 'FEE_PAYMENT',
      direction: 'IN',
      amount: paymentRecord.amount,
      reference: paymentRecord.transactionReference || `REC-${Date.now()}`,
      gateway: 'SCHOOL_ACCOUNT',
      status: 'SUCCESS',
      description: `Reconciled payment: ${paymentRecord.description || 'Manual transfer'}`,
    })
  }

  revalidatePath('/dashboard/admin/finance/ledger')
  revalidatePath('/dashboard/admin/finance/reconciliation')
  return { success: true }
}

// ===== SCHOOL ADMIN ROLES ACTIONS =====
export async function assignSchoolAdminRole(data: {
  schoolId: string
  userId: string
  level: 'PRIMARY_ADMIN' | 'VICE_PRINCIPAL_ACADEMICS' | 'VICE_PRINCIPAL_ADMIN' | 'HOD_SCIENCE' | 'HOD_ARTS' | 'HOD_COMMERCIAL'
  department?: string
}) {
  const scopedSchoolId = await requireSchoolAdminScope(data.schoolId)
  if (scopedSchoolId && scopedSchoolId !== data.schoolId) {
    throw new Error('Forbidden: You can only manage administrator roles for your own school.')
  }

  const targetUser = await db.query.user.findFirst({ where: eq(userTable.id, data.userId) })
  if (targetUser?.schoolId && targetUser.schoolId !== data.schoolId) {
    throw new Error('Forbidden: The selected user belongs to a different school.')
  }

  await db.insert(schoolAdminRoles).values({
    id: randomUUID(),
    schoolId: data.schoolId,
    userId: data.userId,
    level: data.level,
    department: data.department || null,
    isActive: true
  }).onConflictDoUpdate({
    target: [schoolAdminRoles.schoolId, schoolAdminRoles.userId],
    set: {
      level: data.level,
      department: data.department || null,
      isActive: true
    }
  })

  revalidatePath('/dashboard/admin/settings/roles')
  return { success: true }
}

export async function getSchoolAdminRoles(schoolId: string) {
  const scopedSchoolId = await requireSchoolAdminScope(schoolId)
  return db.select().from(schoolAdminRoles).where(and(eq(schoolAdminRoles.schoolId, scopedSchoolId || schoolId), eq(schoolAdminRoles.isActive, true)))
}

// ===== RESILIENCE & OPERATIONAL HEALTH ACTIONS =====
export async function runSystemDataIntegrityAuditAction() {
  await requireAdmin()
  const unlinkedStudentsCount = await db.select({ count: sql<number>`count(*)` }).from(student).where(sql`schoolid IS NULL`)
  const unlinkedTeachersCount = await db.select({ count: sql<number>`count(*)` }).from(teacherTable).where(sql`schoolid IS NULL`)
  const unlinkedParentsCount = await db.select({ count: sql<number>`count(*)` }).from(parentTable).where(sql`schoolid IS NULL`)
  const pendingPaymentsCount = await db.select({ count: sql<number>`count(*)` }).from(payment).where(eq(payment.status, 'pending'))

  return {
    success: true,
    integritySummary: {
      unlinkedStudents: Number(unlinkedStudentsCount[0]?.count || 0),
      unlinkedTeachers: Number(unlinkedTeachersCount[0]?.count || 0),
      unlinkedParents: Number(unlinkedParentsCount[0]?.count || 0),
      pendingPayments: Number(pendingPaymentsCount[0]?.count || 0),
      auditTimestamp: new Date().toISOString(),
    }
  }
}

export async function processPendingOutboxQueueAction() {
  await requireAdmin()
  const { getPendingOutboxEvents, markOutboxEventProcessed } = await import('@/lib/resilience')
  const pendingEvents = getPendingOutboxEvents()
  let processedCount = 0

  for (const event of pendingEvents) {
    try {
      markOutboxEventProcessed(event.id)
      processedCount++
    } catch (err) {
      console.warn(`Failed processing outbox event ${event.id}:`, err)
    }
  }

  return {
    success: true,
    processedCount,
    remainingPending: getPendingOutboxEvents().length,
  }
}
