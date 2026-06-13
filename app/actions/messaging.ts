'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversation, conversationParticipant, message, user, userRole } from '@/lib/db/schema'
import { eq, and, or, desc, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserRoleData(userId: string) {
  return await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
}

export async function getConversations() {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'read',
    'message'
  )

  if (!hasPermission) throw new Error('Permission denied')

  const participants = await db.query.conversationParticipant.findMany({
    where: eq(conversationParticipant.userId, userId),
    with: {
      conversation: {
        with: {
          messages: {
            limit: 1,
            orderBy: (message, { desc }) => [desc(message.createdAt)],
          },
          participants: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  })

  return participants.map(p => p.conversation)
}

export async function createConversation(recipientId: string, type: 'INDIVIDUAL' | 'GROUP' = 'INDIVIDUAL', name?: string) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'create',
    'message',
    { recipientId, type }
  )

  if (!hasPermission) throw new Error('Permission denied')

  const recipient = await db.query.user.findFirst({
    where: eq(user.id, recipientId),
  })

  if (!recipient) throw new Error('Recipient not found')

  const newConversation = await db.insert(conversation).values({
    id: crypto.randomUUID(),
    type,
    name,
  }).returning()

  const convId = newConversation[0].id

  await db.insert(conversationParticipant).values([
    { id: crypto.randomUUID(), conversationId: convId, userId },
    { id: crypto.randomUUID(), conversationId: convId, userId: recipientId },
  ])

  return newConversation[0]
}

export async function sendMessage(conversationId: string, content: string, attachments?: any) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'create',
    'message',
    { conversationId }
  )

  if (!hasPermission) throw new Error('Permission denied')

  const newMessage = await db.insert(message).values({
    id: crypto.randomUUID(),
    conversationId,
    senderId: userId,
    content,
    attachments,
  }).returning()

  await db.update(conversation)
    .set({ updatedAt: new Date() })
    .where(eq(conversation.id, conversationId))

  revalidatePath('/dashboard/communication')
  return newMessage[0]
}

export async function getMessages(conversationId: string) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'read',
    'message',
    { conversationId }
  )

  if (!hasPermission) throw new Error('Permission denied')

  return db.query.message.findMany({
    where: eq(message.conversationId, conversationId),
    orderBy: (message, { asc }) => [asc(message.createdAt)],
    with: {
      sender: true
    }
  })
}

export async function getConversationsForUser(userId: string) {
  const userParticipants = await db.query.conversationParticipant.findMany({
    where: eq(conversationParticipant.userId, userId),
  })

  const conversationIds = userParticipants.map(p => p.conversationId)

  if (conversationIds.length === 0) return []

  return db.query.conversation.findMany({
    where: inArray(conversation.id, conversationIds),
    with: {
      messages: {
        orderBy: [desc(message.createdAt)],
        limit: 1,
      },
      participants: {
        with: {
          user: true
        }
      }
    },
    orderBy: [desc(conversation.updatedAt)]
  })
}
