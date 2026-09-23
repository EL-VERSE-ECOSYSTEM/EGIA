'use server'

import { db } from '@/lib/db'
import { dispute, disputeMessage, supportTicket, supportTicketReply } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createDispute(data: {
  title: string
  category: string
  priority: string
  description: string
  raisedById: string
  relatedStudentId?: string
  relatedPaymentId?: string
}) {
  const ticketNumber = `DIS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const newDispute = await db.insert(dispute).values({
    id: crypto.randomUUID(),
    ticketNumber,
    ...data,
    status: 'OPEN',
  }).returning()

  revalidatePath('/dashboard/admin/communication/disputes')
  return newDispute[0]
}

export async function addDisputeMessage(disputeId: string, senderId: string, messageContent: string, isInternal = false) {
  const disputeExists = await db.query.dispute.findFirst({
    where: eq(dispute.id, disputeId),
  })

  if (!disputeExists) throw new Error('Dispute not found')

  const newMessage = await db.insert(disputeMessage).values({
    id: crypto.randomUUID(),
    disputeId,
    senderId,
    message: messageContent,
    isInternal,
  }).returning()

  await db.update(dispute)
    .set({ updatedAt: new Date() })
    .where(eq(dispute.id, disputeId))

  revalidatePath(`/dashboard/communication/disputes/${disputeId}`)
  return newMessage[0]
}

export async function createSupportTicket(data: {
  title: string
  category: string
  priority: string
  description: string
  userId?: string
}) {
  const ticketNumber = `SUP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  let resolvedUserId: string | null = data.userId || null

  // If userId not provided, attempt to resolve from session
  if (!resolvedUserId) {
    try {
      const { auth } = await import('@/lib/auth')
      const session = await auth.getSession()
      if (session?.user?.id) resolvedUserId = session.user.id
    } catch (e) {
      // ignore session resolution errors
    }
  }

  const newTicket = await db.insert(supportTicket).values({
    id: crypto.randomUUID(),
    ticketNumber,
    userId: resolvedUserId,
    ...data,
    status: 'OPEN',
  } as any).returning()

  // Auto-generate quick response from Super Admin into support_ticket_replies
  try {
    await db.insert(supportTicketReply).values({
      id: crypto.randomUUID(),
      ticketId: newTicket[0].id,
      senderId: 'SUPER_ADMIN',
      replyMessage: "We have taken note of the support submitted, we'll get back to you shortly",
      senderRole: 'SUPER_ADMIN',
      createdAt: new Date(),
    } as any)
  } catch (e) {
    console.warn('Super Admin quick reply insertion error:', e)
  }

  revalidatePath('/dashboard/communication/support')
  return newTicket[0]
}

export async function resolveDispute(disputeId: string, resolution: string, resolvedBy: string) {
  await db.update(dispute)
    .set({
      status: 'RESOLVED',
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(dispute.id, disputeId))

  revalidatePath('/dashboard/admin/communication/disputes')
}
