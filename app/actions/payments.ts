'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment, student, feeStructure, parent as parentTable } from '@/lib/db/schema'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { eq, desc, and } from 'drizzle-orm'

const REGISTRATION_FEE = 2000

async function requireParent() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'PARENT') throw new Error('Parent authentication is required.')
  const profile = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })
  if (!profile) throw new Error('Parent profile not found.')
  return { session, profile }
}

async function requireLinkedChild(parentId: string, studentId: string) {
  const child = await db.query.student.findFirst({
    where: and(eq(student.id, studentId), eq(student.parentId, parentId)),
  })
  if (!child) throw new Error('You can only make payments for a child linked to your account.')
  return child
}

function checkoutUrl(reference: string) {
  const configuredUrl = process.env.KORAPAY_CHECKOUT_URL
  if (!configuredUrl) throw new Error('Korapay checkout is not configured. Set KORAPAY_CHECKOUT_URL before accepting payments.')
  const url = new URL(configuredUrl)
  url.searchParams.set('reference', reference)
  return url.toString()
}

export async function submitManualPayment(data: { studentId: string; amount: string; feeType: string; receiptUrl: string }) {
  const { profile } = await requireParent()
  await requireLinkedChild(profile.id, data.studentId)
  if (!data.receiptUrl || data.receiptUrl.startsWith('mock-')) throw new Error('Upload the receipt to approved storage before submitting it.')
  return (await db.insert(payment).values({
    id: randomUUID(), studentId: data.studentId, parentId: profile.id, amount: data.amount,
    feeType: data.feeType, paymentMethod: 'TRANSFER', transactionReference: `MAN-${randomUUID()}`,
    receiptUrl: data.receiptUrl, status: 'pending', description: 'Manual transfer receipt awaiting admin verification.',
  }).returning())[0]
}

export async function initializeKorapayPayment(data: { studentId: string; amount: number; feeType: string; description?: string }) {
  const { profile } = await requireParent()
  const child = await requireLinkedChild(profile.id, data.studentId)
  if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('A valid payment amount is required.')
  const reference = `EGIA-${Date.now()}-${randomUUID().slice(0, 8)}`
  const record = (await db.insert(payment).values({
    id: randomUUID(), studentId: child.id, parentId: profile.id, amount: data.amount.toFixed(2),
    feeType: data.feeType, paymentMethod: 'KORAPAY', transactionReference: reference,
    status: 'pending', description: data.description || `Payment for ${data.feeType}`,
  }).returning())[0]
  return { checkoutUrl: checkoutUrl(reference), reference, paymentId: record.id }
}

/** Creates a pending registration payment; success is recorded only by the signed Korapay webhook. */
export async function initializeStudentRegistrationPayment(studentId: string) {
  const child = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!child) throw new Error('Student registration record was not found.')
  const reference = `EGIA-REG-${Date.now()}-${randomUUID().slice(0, 8)}`
  const record = (await db.insert(payment).values({
    id: randomUUID(), studentId, amount: REGISTRATION_FEE.toFixed(2), feeType: 'registration',
    paymentMethod: 'KORAPAY', transactionReference: reference, status: 'pending',
    description: `Session registration for ${child.firstName} ${child.lastName}`,
  }).returning())[0]
  return { checkoutUrl: checkoutUrl(reference), reference, paymentId: record.id }
}

export async function getPaymentSummary(studentId: string) {
  const payments = await getStudentPaymentHistory(studentId)
  return {
    totalPaid: payments.filter(p => p.status === 'success').reduce((sum, p) => sum + Number(p.amount), 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    paymentCount: payments.length,
  }
}

export async function getStudentPaymentHistory(studentId?: string) {
  const session = await auth.getSession()
  if (!session?.user) return []
  const profile = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  const id = studentId || profile?.id
  if (!id || (studentId && profile?.id !== studentId && session.user.role !== 'ADMIN')) throw new Error('Unauthorized')
  return db.query.payment.findMany({ where: eq(payment.studentId, id), orderBy: [desc(payment.createdAt)] })
}

export async function getParentPaymentHistory() {
  const { profile } = await requireParent()
  const list = await db.select().from(payment).where(eq(payment.parentId, profile.id)).orderBy(desc(payment.createdAt))
  const children = await db.query.student.findMany({ where: eq(student.parentId, profile.id) })
  const names = new Map(children.map(child => [child.id, `${child.firstName} ${child.lastName}`]))
  return list.map(record => ({ ...record, childName: names.get(record.studentId) || 'Linked learner' }))
}

export async function getStudentIdByAdmissionNumber(admissionNumber: string) {
  const s = await db.query.student.findFirst({ where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase()) })
  return s?.id || null
}

export async function getFeeStructuresForClass(className: string, department?: string) {
  return db.query.feeStructure.findMany({ where: and(eq(feeStructure.class, className), eq(feeStructure.isActive, true)) })
}
