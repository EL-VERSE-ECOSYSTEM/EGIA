'use server'

import { db } from '@/lib/db'
import { dispute, disputeMessage, supportTicket } from '@/lib/db/schema'
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
  const ticketNumber = `DIS-${Date.now()}`

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
  await db.insert(disputeMessage).values({
    id: crypto.randomUUID(),
    disputeId,
    senderId,
    message: messageContent,
    isInternal,
  })

  await db.update(dispute)
    .set({ updatedAt: new Date() })
    .where(eq(dispute.id, disputeId))

  revalidatePath(`/dashboard/communication/disputes/${disputeId}`)
}

export async function createSupportTicket(data: {
  title: string
  category: string
  priority: string
  description: string
  userId: string
}) {
  const ticketNumber = `SUP-${Date.now()}`

  const newTicket = await db.insert(supportTicket).values({
    id: crypto.randomUUID(),
    ticketNumber,
    ...data,
    status: 'OPEN',
  }).returning()

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
