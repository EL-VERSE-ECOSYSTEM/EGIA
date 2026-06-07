'use server'

import { db } from '@/lib/db'
import { conversation, conversationParticipant, message, user } from '@/lib/db/schema'
import { eq, and, or, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createConversation(participantIds: string[], type: 'INDIVIDUAL' | 'GROUP', name?: string) {
  const conversationId = crypto.randomUUID()

  await db.insert(conversation).values({
    id: conversationId,
    type,
    name,
  })

  const participants = participantIds.map(userId => ({
    id: crypto.randomUUID(),
    conversationId,
    userId,
  }))

  await db.insert(conversationParticipant).values(participants)

  return conversationId
}

export async function sendMessage(conversationId: string, senderId: string, content: string, attachments?: any) {
  const newMessage = await db.insert(message).values({
    id: crypto.randomUUID(),
    conversationId,
    senderId,
    content,
    attachments,
  }).returning()

  await db.update(conversation)
    .set({ updatedAt: new Date() })
    .where(eq(conversation.id, conversationId))

  revalidatePath(`/dashboard/messages/${conversationId}`)
  return newMessage[0]
}

export async function getConversationsForUser(userId: string) {
  const userParticipants = await db.query.conversationParticipant.findMany({
    where: eq(conversationParticipant.userId, userId),
  })

  const conversationIds = userParticipants.map(p => p.conversationId)

  if (conversationIds.length === 0) return []

  return db.query.conversation.findMany({
    where: or(...conversationIds.map(id => eq(conversation.id, id))),
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

export async function getMessages(conversationId: string) {
  return db.query.message.findMany({
    where: eq(message.conversationId, conversationId),
    orderBy: [desc(message.createdAt)],
    with: {
      sender: true
    }
  })
}
