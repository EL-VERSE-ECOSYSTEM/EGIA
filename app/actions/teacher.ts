'use server'
import { db } from '@/lib/db'
import { assessment } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'

export async function createAssessment(data: any) {
  const result = await db.insert(assessment).values({
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  revalidatePath('/dashboard/teacher/assessments')
  return result[0]
}
import { auth } from '@/lib/auth'
import { teacher, class_, student, assessmentResult, attendance, parent } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getTeacherProfile() {
  const userId = await getUserId()
  return db.query.teacher.findFirst({
    where: eq(teacher.userId, userId),
    with: {
      classes: true,
      subjects: true
    }
  })
}

export async function getStudentsInClass(classId: string) {
  const classData = await db.query.class_.findFirst({
    where: eq(class_.id, classId)
  })
  if (!classData) throw new Error('Class not found')

  return db.query.student.findMany({
    where: eq(student.class, classData.name),
    with: {
      parent: {
        with: {
          user: true
        }
      }
    }
  })
}

export async function getStudentFullProfile(studentId: string) {
  return db.query.student.findFirst({
    where: eq(student.id, studentId),
    with: {
      parent: {
        with: {
          user: true
        }
      },
      results: {
        with: {
          assessment: true
        }
      },
      attendance: true,
      payments: true
    }
  })
}
