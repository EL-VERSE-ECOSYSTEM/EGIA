'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { conversation, conversationParticipant, message, user, userRole, student, notification as notificationTable } from '@/lib/db/schema'
import { eq, and, or, desc, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'
import { moderateMessage } from '@/lib/moderation'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserWithSchool(userId: string) {
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      userRole: true
    }
  })
  if (!currentUser) throw new Error('User account not found')
  return currentUser
}

export async function getConversations() {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  const hasPermission = await checkPermission(
    userId,
    currentUser.userRole?.role || '',
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

  // Filter conversations by school boundary (Super Admin sees all)
  return participants
    .map(p => p.conversation)
    .filter(c => currentUser.userRole?.role === 'SUPER_ADMIN' || !c.schoolId || !currentUser.schoolId || c.schoolId === currentUser.schoolId)
}

export async function createConversation(recipientId: string, type: 'INDIVIDUAL' | 'GROUP' = 'INDIVIDUAL', name?: string) {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  const hasPermission = await checkPermission(
    userId,
    currentUser.userRole?.role || '',
    'create',
    'message',
    { recipientId, type }
  )

  if (!hasPermission) throw new Error('Permission denied')

  const recipient = await db.query.user.findFirst({
    where: eq(user.id, recipientId),
  })

  if (!recipient) throw new Error('Recipient not found')

  // Enforce single-school boundary isolation
  if (currentUser.userRole?.role !== 'SUPER_ADMIN' && currentUser.schoolId && recipient.schoolId && currentUser.schoolId !== recipient.schoolId) {
    throw new Error('Messaging is restricted to members registered within your specific school.')
  }

  const convId = crypto.randomUUID()
  const newConversation = await db.insert(conversation).values({
    id: convId,
    schoolId: currentUser.schoolId || recipient.schoolId || null,
    type,
    name,
  }).returning()

  await db.insert(conversationParticipant).values([
    { id: crypto.randomUUID(), conversationId: convId, userId },
    { id: crypto.randomUUID(), conversationId: convId, userId: recipientId },
  ])

  return newConversation[0]
}

export async function createGroupConversation(participantIds: string[], groupName: string) {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  const convId = crypto.randomUUID()
  const newConversation = await db.insert(conversation).values({
    id: convId,
    schoolId: currentUser.schoolId || null,
    type: 'GROUP',
    name: groupName,
  }).returning()

  const allParticipantIds = Array.from(new Set([userId, ...participantIds]))
  const participantInserts = allParticipantIds.map(pId => ({
    id: crypto.randomUUID(),
    conversationId: convId,
    userId: pId
  }))

  await db.insert(conversationParticipant).values(participantInserts)
  return newConversation[0]
}

export async function sendMessage(conversationId: string, content: string, attachments?: any) {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  const hasPermission = await checkPermission(
    userId,
    currentUser.userRole?.role || '',
    'create',
    'message',
    { conversationId }
  )

  if (!hasPermission) throw new Error('Permission denied')

  // Run backend moderation and content filtration
  const moderation = moderateMessage(content)
  if (!moderation.allowed) {
    try {
      const studentRecord = await db.query.student.findFirst({
        where: eq(student.userId, userId)
      })
      if (studentRecord) {
        const recordId = crypto.randomUUID()
        await db.execute(sql`
          INSERT INTO public.disciplinary_records (
            id, student_id, reported_by_id, incident_date, incident_type, description, status, created_at, updated_at
          ) VALUES (
            ${recordId}::uuid,
            ${studentRecord.id}::uuid,
            ${userId}::uuid,
            CURRENT_DATE,
            'In-App Messaging Violation',
            ${`Attempted prohibited message: "${content.substring(0, 100)}...". Reason: ${moderation.reason}`},
            'PENDING',
            NOW(),
            NOW()
          )
        `)
      }
    } catch (discErr) {
      console.warn('Could not auto-record messaging infraction:', discErr)
    }

    throw new Error(moderation.reason)
  }

  const newMessage = await db.insert(message).values({
    id: crypto.randomUUID(),
    conversationId,
    senderId: userId,
    schoolId: currentUser.schoolId || null,
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
  const currentUser = await getUserWithSchool(userId)

  const hasPermission = await checkPermission(
    userId,
    currentUser.userRole?.role || '',
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

export async function getAllUsersForMessaging() {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  const users = await db.query.user.findMany({
    orderBy: (user, { asc }) => [asc(user.name)],
    with: {
      userRole: true
    }
  })

  // Filter users by school boundary (Super Admin sees all users across schools)
  return users
    .filter(u => currentUser.userRole?.role === 'SUPER_ADMIN' || !u.schoolId || !currentUser.schoolId || u.schoolId === currentUser.schoolId)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.userRole?.role || 'USER'
    }))
}

export async function getAllSystemUsers() {
  return getAllUsersForMessaging()
}

export async function getUsersByRole(roleName: string) {
  const all = await getAllUsersForMessaging()
  return all.filter(u => u.role.toUpperCase() === roleName.toUpperCase())
}

export async function adminDeleteMessage(messageId: string) {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)
  if (currentUser.userRole?.role !== 'ADMIN' && currentUser.userRole?.role !== 'SUPER_ADMIN') {
    throw new Error('Permission denied')
  }
  await db.delete(message).where(eq(message.id, messageId))
  return { success: true }
}

export async function adminDeleteConversation(conversationId: string) {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)
  if (currentUser.userRole?.role !== 'ADMIN' && currentUser.userRole?.role !== 'SUPER_ADMIN') {
    throw new Error('Permission denied')
  }
  await db.delete(conversation).where(eq(conversation.id, conversationId))
  return { success: true }
}

export async function adminSendNotification(targetUserId: string, title: string, bodyText: string, type: string = 'info') {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  if (currentUser.userRole?.role !== 'ADMIN' && currentUser.userRole?.role !== 'SUPER_ADMIN') {
    throw new Error('Permission denied')
  }

  return db.insert(notificationTable).values({
    id: crypto.randomUUID(),
    userId: targetUserId,
    schoolId: currentUser.schoolId || null,
    title,
    message: bodyText,
    type,
    isRead: false,
    createdAt: new Date()
  } as any).returning()
}

export async function adminBroadcastNotification(title: string, bodyText: string, targetRole?: string) {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  let users = await getAllUsersForMessaging()
  if (targetRole) {
    users = users.filter(u => u.role.toUpperCase() === targetRole.toUpperCase())
  }

  const inserts = users.map(u => ({
    id: crypto.randomUUID(),
    userId: u.id,
    schoolId: currentUser.schoolId || null,
    title,
    message: bodyText,
    type: 'BROADCAST',
    isRead: false,
    createdAt: new Date()
  }))

  if (inserts.length > 0) {
    await db.insert(notificationTable).values(inserts as any)
  }

  return { success: true, count: inserts.length }
}

export async function broadcastMessage(content: string, recipientRole: string) {
  const userId = await getUserId()
  const currentUser = await getUserWithSchool(userId)

  if (currentUser.userRole?.role !== 'ADMIN' && currentUser.userRole?.role !== 'SUPER_ADMIN') {
    throw new Error('Permission denied')
  }

  // Get users for recipientRole filtered by school
  const targetRoles = await db.select().from(userRole).where(eq(userRole.role, recipientRole))
  const targetUserIds = targetRoles.map(r => r.userId)

  if (targetUserIds.length === 0) return

  const targetUsersList = await db.query.user.findMany({
    where: inArray(user.id, targetUserIds)
  })

  const targetUsers = targetUsersList
    .filter(u => currentUser.userRole?.role === 'SUPER_ADMIN' || !u.schoolId || !currentUser.schoolId || u.schoolId === currentUser.schoolId)

  if (targetUsers.length === 0) return

  const convId = crypto.randomUUID()
  const newConversation = await db.insert(conversation).values({
    id: convId,
    schoolId: currentUser.schoolId || null,
    type: 'BROADCAST',
    name: `Broadcast to ${recipientRole}s - ${new Date().toLocaleDateString()}`,
  }).returning()

  const participants = [
    { id: crypto.randomUUID(), conversationId: convId, userId },
    ...targetUsers.map(u => ({ id: crypto.randomUUID(), conversationId: convId, userId: u.id }))
  ]

  await db.insert(conversationParticipant).values(participants)

  await db.insert(message).values({
    id: crypto.randomUUID(),
    conversationId: convId,
    senderId: userId,
    schoolId: currentUser.schoolId || null,
    content,
  })

  revalidatePath('/dashboard/communication')
}
