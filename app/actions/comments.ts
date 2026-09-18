'use server'

import { randomUUID } from 'crypto'
import { and, eq, asc, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { classComments, user as userTable, teacher, student, parent } from '@/lib/db/schema'

export async function getClassComments(resourceType: string, resourceId: string) {
  if (!resourceType || !resourceId) return []

  try {
    const comments = await db
      .select()
      .from(classComments)
      .where(
        and(
          eq(classComments.resourceType, resourceType),
          eq(classComments.resourceId, resourceId)
        )
      )
      .orderBy(asc(classComments.createdAt))

    return comments
  } catch (error) {
    console.error('Error fetching class comments:', error)
    return []
  }
}

export async function postClassComment(data: {
  resourceType: string
  resourceId: string
  content: string
  parentId?: string
}) {
  const session = await auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized. Please sign in to post comments.')
  }

  const content = data.content?.trim()
  if (!content) {
    throw new Error('Comment content cannot be empty.')
  }

  const userId = session.user.id
  let userName = session.user.name || 'Anonymous User'
  let userRole = (session.user.role || 'STUDENT').toUpperCase()
  let userImage: string | null = (session.user as any)?.image || null

  // Resolve user profile name and image from specific profile tables if available
  try {
    if (userRole === 'TEACHER') {
      const tProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, userId) })
      if (tProfile) {
        userName = `${tProfile.firstName} ${tProfile.lastName}`
        if (tProfile.profileImage) userImage = tProfile.profileImage
      }
    } else if (userRole === 'STUDENT' || userRole === 'PUPIL') {
      const sProfile = await db.query.student.findFirst({ where: eq(student.userId, userId) })
      if (sProfile) {
        userName = `${sProfile.firstName} ${sProfile.lastName}`
        if (sProfile.profileImage) userImage = sProfile.profileImage
      }
    } else if (userRole === 'PARENT') {
      const pProfile = await db.query.parent.findFirst({ where: eq(parent.userId, userId) })
      if (pProfile) {
        userName = `${pProfile.firstName} ${pProfile.lastName}`
        if (pProfile.profileImage) userImage = pProfile.profileImage
      }
    } else {
      const uRecord = await db.query.user.findFirst({ where: eq(userTable.id, userId) })
      if (uRecord?.name) userName = uRecord.name
      if (uRecord?.image) userImage = uRecord.image
    }
  } catch (err) {
    console.warn('Profile details resolution notice:', err)
  }

  const newCommentId = randomUUID()

  const [inserted] = await db
    .insert(classComments)
    .values({
      id: newCommentId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      userId,
      userName,
      userRole,
      userImage,
      content,
      parentId: data.parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  revalidatePath('/dashboard/student/video-sessions')
  revalidatePath('/dashboard/teacher/video-sessions')
  revalidatePath('/dashboard/parent/adult-education/video-classes')
  revalidatePath('/dashboard/parent/adult-education/live-classes')
  revalidatePath('/dashboard/teacher/adult-education/video-classes')
  revalidatePath('/dashboard/teacher/adult-education/live-classes')

  return inserted
}

export async function deleteClassComment(commentId: string) {
  const session = await auth.getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized.')
  }

  const commentRecord = await db.query.classComments.findFirst({
    where: eq(classComments.id, commentId),
  })

  if (!commentRecord) {
    throw new Error('Comment not found.')
  }

  const isAuthor = commentRecord.userId === session.user.id
  const isElevatedRole = ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(
    (session.user.role || '').toUpperCase()
  )

  if (!isAuthor && !isElevatedRole) {
    throw new Error('Permission denied. You can only delete your own comments.')
  }

  await db.delete(classComments).where(eq(classComments.id, commentId))

  revalidatePath('/dashboard/student/video-sessions')
  revalidatePath('/dashboard/teacher/video-sessions')
  revalidatePath('/dashboard/parent/adult-education/video-classes')
  revalidatePath('/dashboard/parent/adult-education/live-classes')
  revalidatePath('/dashboard/teacher/adult-education/video-classes')
  revalidatePath('/dashboard/teacher/adult-education/live-classes')

  return { success: true }
}
