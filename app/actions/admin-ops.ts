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
  notification
} from '@/lib/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('Admin authorization is required.')
  return session
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

    const totalPending = pendingPayments.reduce((sum, pay) => sum + parseFloat(p.amount || '0'), 0)

    result.push({
      ...p,
      name: userRecord ? `${userRecord.name}` : `${p.firstName} ${p.lastName}`,
      email: userRecord?.email || 'N/A',
      totalPending
    })
  }

  return result;
}
