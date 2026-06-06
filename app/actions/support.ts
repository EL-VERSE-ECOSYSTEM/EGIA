'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { dispute, disputeMessage, supportTicket, userRole } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserRoleData(userId: string) {
  return await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
}

export async function createDispute(data: {
  title: string
  category: string
  priority: string
  description: string
  relatedStudentId?: string
  relatedPaymentId?: string
}) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'create',
    'dispute'
  )

  if (!hasPermission) throw new Error('Permission denied')

  const ticketNumber = `DISP-${Date.now()}`

  return db.insert(dispute).values({
    id: crypto.randomUUID(),
    ticketNumber,
    ...data,
    raisedById: userId,
    status: 'OPEN',
  }).returning()
}

export async function resolveDispute(disputeId: string, resolution: string) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'update',
    'dispute'
  )

  if (!hasPermission) throw new Error('Permission denied')

  return db.update(dispute)
    .set({
      status: 'RESOLVED',
      resolution,
      resolvedBy: userId,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(dispute.id, disputeId))
    .returning()
}

export async function createSupportTicket(data: {
  title: string
  category: string
  priority: string
  description: string
}) {
  const userId = await getUserId()
  const ticketNumber = `SUPP-${Date.now()}`

  return db.insert(supportTicket).values({
    id: crypto.randomUUID(),
    ticketNumber,
    ...data,
    userId,
    status: 'OPEN',
  }).returning()
}

export async function getMyDisputes() {
  const userId = await getUserId()
  return db.query.dispute.findMany({
    where: eq(dispute.raisedById, userId),
    orderBy: (dispute, { desc }) => [desc(dispute.createdAt)],
  })
}

export async function getMyTickets() {
  const userId = await getUserId()
  return db.query.supportTicket.findMany({
    where: eq(supportTicket.userId, userId),
    orderBy: (supportTicket, { desc }) => [desc(supportTicket.createdAt)],
  })
}
