'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { message, notification } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function sendMessage(data: {
  recipientId: string
  subject?: string
  content: string
}) {
  const userId = await getUserId()

  const newMessage = await db.insert(message).values({
    id: crypto.randomUUID(),
    senderId: userId,
    recipientId: data.recipientId,
    subject: data.subject,
    content: data.content,
    isRead: false,
    createdAt: new Date(),
  }).returning()

  // Create notification for recipient
  await createNotification({
    userId: data.recipientId,
    title: 'New Message',
    message: data.subject || `New message from a user`,
    type: 'INFO',
  })

  return newMessage[0]
}

export async function getMessages(userId?: string) {
  const currentUserId = await getUserId()
  if (!userId) userId = currentUserId

  return db.query.message.findMany({
    where: or(
      eq(message.senderId, currentUserId),
      eq(message.recipientId, currentUserId)
    ),
  })
}

export async function markMessageAsRead(messageId: string) {
  const userId = await getUserId()

  const msg = await db.query.message.findFirst({
    where: eq(message.id, messageId),
  })

  if (!msg || msg.recipientId !== userId) {
    throw new Error('Unauthorized')
  }

  const result = await db.update(message)
    .set({ isRead: true })
    .where(eq(message.id, messageId))
    .returning()

  return result[0]
}

export async function createNotification(data: {
  userId: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  metadata?: Record<string, any>
}) {
  const newNotification = await db.insert(notification).values({
    id: crypto.randomUUID(),
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    isRead: false,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    createdAt: new Date(),
  }).returning()

  return newNotification[0]
}

export async function getNotifications(userId?: string) {
  const currentUserId = await getUserId()
  if (!userId) userId = currentUserId

  return db.query.notification.findMany({
    where: eq(notification.userId, userId),
  })
}

export async function markNotificationAsRead(notificationId: string) {
  const userId = await getUserId()

  const notif = await db.query.notification.findFirst({
    where: eq(notification.id, notificationId),
  })

  if (!notif || notif.userId !== userId) {
    throw new Error('Unauthorized')
  }

  const result = await db.update(notification)
    .set({ isRead: true })
    .where(eq(notification.id, notificationId))
    .returning()

  return result[0]
}

export async function getUnreadCount(userId?: string) {
  const currentUserId = await getUserId()
  if (!userId) userId = currentUserId

  const notifications = await db.query.notification.findMany({
    where: eq(notification.userId, userId),
  })

  const messages = await db.query.message.findMany({
    where: eq(message.recipientId, userId),
  })

  return {
    notifications: notifications.filter(n => !n.isRead).length,
    messages: messages.filter(m => !m.isRead).length,
    total: notifications.filter(n => !n.isRead).length + messages.filter(m => !m.isRead).length,
  }
}
