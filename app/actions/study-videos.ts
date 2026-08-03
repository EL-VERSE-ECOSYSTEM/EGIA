'use server'

import { randomUUID } from 'crypto'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, studyVideo, studyVideoQuestion, studyVideoReply, teacher } from '@/lib/db/schema'

async function currentTeacher() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') throw new Error('Unauthorized')
  const profile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!profile) throw new Error('Teacher profile not found')
  return profile
}

export async function publishStudyVideo(input: { title: string; description: string; subject: string; className: string; videoUrl: string; durationMinutes?: number }) {
  const profile = await currentTeacher()
  const url = new URL(input.videoUrl)
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Use a valid HTTPS video URL.')
  if (!input.title.trim() || !input.description.trim() || !input.subject.trim() || !input.className.trim()) throw new Error('Complete all video details.')
  const result = (await db.insert(studyVideo).values({
    id: randomUUID(), title: input.title.trim(), description: input.description.trim(), subject: input.subject.trim(),
    className: input.className.trim(), videoUrl: url.toString(), durationMinutes: input.durationMinutes || null, teacherId: profile.id,
  }).returning())[0]
  revalidatePath('/dashboard/teacher/video-sessions')
  revalidatePath('/dashboard/student/video-sessions')
  return result
}

export async function getTeacherStudyVideos() {
  const profile = await currentTeacher()
  return db.query.studyVideo.findMany({ where: eq(studyVideo.teacherId, profile.id), orderBy: [desc(studyVideo.createdAt)] })
}

export async function getStudentStudyVideos() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') throw new Error('Unauthorized')
  const profile = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  if (!profile) throw new Error('Student profile not found')
  return db.query.studyVideo.findMany({ where: and(eq(studyVideo.className, profile.class), eq(studyVideo.isPublished, true)), orderBy: [desc(studyVideo.createdAt)] })
}

export async function askStudyVideoQuestion(videoId: string, content: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') throw new Error('Unauthorized')
  const profile = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  const video = profile && await db.query.studyVideo.findFirst({ where: and(eq(studyVideo.id, videoId), eq(studyVideo.className, profile.class), eq(studyVideo.isPublished, true)) })
  if (!profile || !video) throw new Error('Video not available to this learner')
  if (!content.trim()) throw new Error('Write a question first.')
  return (await db.insert(studyVideoQuestion).values({ id: randomUUID(), videoId, studentId: profile.id, content: content.trim() }).returning())[0]
}

export async function getStudyVideoQuestions(videoId: string) {
  const profile = await currentTeacher()
  const video = await db.query.studyVideo.findFirst({ where: and(eq(studyVideo.id, videoId), eq(studyVideo.teacherId, profile.id)) })
  if (!video) throw new Error('Video not found')
  return db.query.studyVideoQuestion.findMany({ where: eq(studyVideoQuestion.videoId, videoId), orderBy: [desc(studyVideoQuestion.createdAt)] })
}

export async function replyToStudyVideoQuestion(questionId: string, content: string) {
  const profile = await currentTeacher()
  if (!content.trim()) throw new Error('Write a reply first.')
  const question = await db.query.studyVideoQuestion.findFirst({ where: eq(studyVideoQuestion.id, questionId) })
  const video = question && await db.query.studyVideo.findFirst({ where: and(eq(studyVideo.id, question.videoId), eq(studyVideo.teacherId, profile.id)) })
  if (!video) throw new Error('Question not found')
  return (await db.insert(studyVideoReply).values({ id: randomUUID(), questionId, teacherId: profile.id, content: content.trim() }).returning())[0]
}
