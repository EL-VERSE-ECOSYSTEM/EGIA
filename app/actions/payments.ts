'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment, student, feeStructure, parent as parentTable } from '@/lib/db/schema'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { eq, desc, and, or, isNull } from 'drizzle-orm'

const KORAPAY_GATEWAY_FEE = 161.25
const REGISTRATION_FEE = 2000

export async function getKorapayGatewayFee() {
  return KORAPAY_GATEWAY_FEE
}
const KORAPAY_CHECKOUT_LINK = process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW'

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
  const url = new URL(KORAPAY_CHECKOUT_LINK)
  url.searchParams.set('reference', reference)
  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    url.searchParams.set('redirect_url', `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`)
  }
  return url.toString()
}

/**
 * Called after Korapay returns the customer to the portal. The redirect itself
 * is untrusted, so the server verifies reference, status and amount with
 * Korapay before changing the local ledger or granting registration access.
 */
export async function verifyKorapayPayment(reference: string) {
  const normalizedReference = reference.trim()
  if (!normalizedReference) throw new Error('A payment reference is required.')
  const record = await db.query.payment.findFirst({ where: eq(payment.transactionReference, normalizedReference) })
  if (!record) throw new Error('This payment reference was not found.')
  if (record.status === 'success') return { status: 'success' as const, paymentId: record.id, payment: record }

  const secret = process.env.KORAPAY_SECRET_KEY
  if (!secret) throw new Error('Korapay verification is not configured. Please contact support.')
  const response = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(normalizedReference)}`, {
    headers: { Authorization: `Bearer ${secret}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Korapay could not verify this payment yet. Please try again shortly.')
  const gateway = await response.json() as { data?: { reference?: string; status?: string; amount?: string | number; amount_paid?: string | number } }
  const charge = gateway.data
  if (!charge || charge.reference !== normalizedReference) throw new Error('Korapay returned an invalid payment response.')

  const gatewayStatus = String(charge.status || '').toLowerCase()
  if (gatewayStatus === 'success' && Number(charge.amount) === Number(record.amount)) {
    await db.transaction(async (tx) => {
      await tx.update(payment).set({ status: 'success', paidAt: new Date(), paymentDate: new Date(), updatedAt: new Date() }).where(eq(payment.id, record.id))
      if (record.feeType === 'registration') {
        await tx.update(student).set({ registrationStatus: 'ACTIVE', updatedAt: new Date() }).where(eq(student.id, record.studentId))
      }
    })
    revalidatePath('/dashboard/parent/payments/history')
    revalidatePath('/dashboard/student/payments/history')
    return { status: 'success' as const, paymentId: record.id, payment: record }
  }
  if (gatewayStatus === 'failed') {
    await db.update(payment).set({ status: 'failed', updatedAt: new Date() }).where(eq(payment.id, record.id))
    return { status: 'failed' as const, paymentId: record.id, payment: record }
  }
  return { status: 'pending' as const, paymentId: record.id, payment: record }
}

export async function submitManualPayment(data: { studentId: string; amount: string; feeType: string; receiptUrl: string }) {
  const { profile } = await requireParent()
  await requireLinkedChild(profile.id, data.studentId)
  if (!data.receiptUrl || !/^https:\/\//.test(data.receiptUrl)) throw new Error('Upload the receipt to approved storage before submitting it.')
  return (await db.insert(payment).values({
    id: randomUUID(), studentId: data.studentId, parentId: profile.id, amount: data.amount,
    feeType: data.feeType, paymentMethod: 'TRANSFER', transactionReference: `MAN-${randomUUID()}`,
    receiptUrl: data.receiptUrl, status: 'pending', description: 'Manual transfer receipt awaiting admin verification.',
  }).returning())[0]
}

export async function initializeKorapayPayment(data: { studentId: string; amount: number; feeType: string; description?: string }) {
  const { profile } = await requireParent()
  const child = await requireLinkedChild(profile.id, data.studentId)
  const configuredFee = await db.query.feeStructure.findFirst({
    where: and(
      eq(feeStructure.class, child.class),
      eq(feeStructure.feeType, data.feeType),
      eq(feeStructure.isActive, true),
      or(eq(feeStructure.department, child.department || ''), isNull(feeStructure.department)),
    ),
  })
  if (!configuredFee) throw new Error('This fee is not available for the selected learner.')
  const baseAmount = Number(configuredFee.amount)
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) throw new Error('The configured fee amount is invalid.')
  const totalAmount = baseAmount + KORAPAY_GATEWAY_FEE
  const reference = `EGIA-${Date.now()}-${randomUUID().slice(0, 8)}`
  const record = (await db.insert(payment).values({
    id: randomUUID(), studentId: child.id, parentId: profile.id, amount: totalAmount.toFixed(2),
    feeType: data.feeType, paymentMethod: 'KORAPAY', transactionReference: reference,
    status: 'pending', description: data.description || `Payment for ${data.feeType} (includes NGN 161.25 gateway fee)`,
  }).returning())[0]
  return { checkoutUrl: checkoutUrl(reference), reference, paymentId: record.id, totalAmount }
}

/** Creates a pending registration payment (NGN 2000 + NGN 161.25 fee = NGN 2161.25); success is recorded by Korapay verification/webhook. */
export async function initializeStudentRegistrationPayment(studentId: string) {
  const child = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!child) throw new Error('Student registration record was not found.')
  const totalAmount = REGISTRATION_FEE + KORAPAY_GATEWAY_FEE
  const reference = `EGIA-REG-${Date.now()}-${randomUUID().slice(0, 8)}`
  const record = (await db.insert(payment).values({
    id: randomUUID(), studentId, amount: totalAmount.toFixed(2), feeType: 'registration',
    paymentMethod: 'KORAPAY', transactionReference: reference, status: 'pending',
    description: `Session registration for ${child.firstName} ${child.lastName} (NGN 2000 + NGN 161.25 gateway fee)`,
  }).returning())[0]
  await db.update(student).set({ registrationStatus: 'PENDING_PAYMENT', updatedAt: new Date() }).where(eq(student.id, studentId))

  const secretKey = process.env.KORAPAY_SECRET_KEY
  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let checkout = checkoutUrl(reference)

  if (secretKey) {
    try {
      const payload = {
        amount: totalAmount,
        currency: 'NGN',
        reference,
        narration: `Student Registration Fee - ${child.firstName} ${child.lastName}`,
        notification_url: `${siteUrl.replace(/\/$/, '')}/api/webhooks/korapay`,
        redirect_url: `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`,
        customer: {
          email: child.email || `student_${child.admissionNumber}@ellearners.app`,
          name: `${child.firstName} ${child.lastName}`,
        },
        metadata: {
          studentId,
          type: 'STUDENT_REGISTRATION',
        },
      }
      const res = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const koraData = await res.json()
        if (koraData.status && koraData.data?.checkout_url) {
          checkout = koraData.data.checkout_url
        }
      }
    } catch (e) {
      console.warn('Failed to call Korapay initialize API for student registration:', e)
    }
  }

  return { checkoutUrl: checkout, reference, paymentId: record.id, totalAmount }
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
  return db.query.feeStructure.findMany({
    where: and(
      eq(feeStructure.class, className),
      eq(feeStructure.isActive, true),
      or(eq(feeStructure.department, department || ''), isNull(feeStructure.department)),
    ),
  })
}
