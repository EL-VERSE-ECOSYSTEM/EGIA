'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { libraryBooks, lessonNotes, subject, teacher as teacherTable, user as userTable } from '@/lib/db/schema'
import { asc, eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function getLibrarySubjects() {
  return db.select({ id: subject.id, name: subject.name })
    .from(subject)
    .where(eq(subject.isActive, true))
    .orderBy(asc(subject.name))
}

export async function searchLibraryBooks(query: string = '', schoolId?: string) {
  try {
    const session = await auth.getSession()
    let currentSchoolId = schoolId

    if (!currentSchoolId && session?.user) {
      const uRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
      if (uRec?.schoolId) currentSchoolId = uRec.schoolId
    }

    const results = await db.select().from(libraryBooks)
    const trimmedQuery = query.trim().toLowerCase()

    if (!trimmedQuery) {
      return results
        .filter(book => {
          const isLessonNoteOrSyllabus = book.category === 'Lesson Notes' || book.category === 'Syllabus' || book.category === 'Scheme of Work'
          if (isLessonNoteOrSyllabus && currentSchoolId && (book as any).schoolId && (book as any).schoolId !== currentSchoolId) {
            return false
          }
          return true
        })
        .map(book => ({
          id: book.id,
          title: book.title,
          category: book.category || 'Textbooks',
          subject: book.subject || 'Mathematics',
          classLevel: book.classLevel || 'SSS 1',
          author: book.author || 'EL LEARNERS APP AUTHOR',
          pages: book.category === 'Video Tutorials' ? 1 : (book.pages || 210),
          downloads: book.borrowedCount || 85,
          fileSize: book.fileUrl ? 'PDF Document' : '12.4 MB',
          content: book.content || book.description || ''
        }))
    }

    const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean)

    const filtered = results.filter(book => {
      const isLessonNoteOrSyllabus = book.category === 'Lesson Notes' || book.category === 'Syllabus' || book.category === 'Scheme of Work'
      if (isLessonNoteOrSyllabus && currentSchoolId && (book as any).schoolId && (book as any).schoolId !== currentSchoolId) {
        return false
      }

      const fullText = `
        ${book.title || ''}
        ${book.author || ''}
        ${book.category || ''}
        ${book.subject || ''}
        ${book.classLevel || ''}
        ${book.content || ''}
      `.toLowerCase()

      if (!trimmedQuery || fullText.includes(trimmedQuery)) {
        return true
      }
      return searchTerms.every(term => fullText.includes(term))
    })

    return filtered.map(book => ({
      id: book.id,
      title: book.title,
      category: book.category || 'Textbooks',
      subject: book.subject || 'Mathematics',
      classLevel: book.classLevel || 'SSS 1',
      author: book.author || 'EL LEARNERS APP AUTHOR',
      pages: book.category === 'Video Tutorials' ? 1 : (book.pages || 210),
      downloads: book.borrowedCount || 85,
      fileSize: book.fileUrl ? 'PDF Document' : '12.4 MB',
      content: book.content || book.description || '',
      fileUrl: book.fileUrl || null
    }))
  } catch (error) {
    console.error('Library search error:', error)
    return []
  }
}

export async function createLessonNote(data: {
  title: string
  subject: string
  classLevel: string
  author?: string
  category?: string
  content?: string
  description?: string
  fileUrl?: string
  storagePath?: string
  fileSize?: string
  pages?: number
  isPdf?: boolean
  isDigital?: boolean
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await auth.getSession()
    if (!session?.user) return { success: false, error: 'Unauthorized session' }

    const role = (session.user.role || '').toUpperCase()
    if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return { success: false, error: 'Forbidden: Insufficient permissions to create lesson notes.' }
    }

    let schoolId = session.user.schoolId || null
    let teacherId: string | null = null

    if (role === 'TEACHER') {
      const tProfile = await db.query.teacher.findFirst({
        where: eq(teacherTable.userId, session.user.id)
      })
      if (!tProfile) return { success: false, error: 'Teacher record not found' }
      teacherId = tProfile.id
      schoolId = tProfile.schoolId || schoolId
    } else {
      const uRec = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id)
      })
      if (uRec?.schoolId) schoolId = uRec.schoolId
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, error: 'Lesson note title is required.' }
    }

    const id = `note-${randomUUID()}`
    const category = data.category || 'Lesson Notes'
    const authorName = data.author || session.user.name || 'Academy Educator'

    await db.transaction(async (tx) => {
      await tx.insert(lessonNotes).values({
        id,
        schoolId: schoolId || null,
        teacherId: teacherId || null,
        title: data.title.trim(),
        subject: data.subject,
        classLevel: data.classLevel,
        author: authorName,
        category,
        content: data.content || data.description || '',
        description: data.description || data.content || '',
        fileUrl: data.fileUrl || null,
        storagePath: data.storagePath || null,
        fileSize: data.fileSize || null,
        isPdf: data.isPdf ?? false,
        isDigital: data.isDigital ?? true
      }).onConflictDoNothing()

      await tx.insert(libraryBooks).values({
        id,
        title: data.title.trim(),
        subject: data.subject,
        classLevel: data.classLevel,
        author: authorName,
        category,
        content: data.content || data.description || '',
        description: data.description || data.content || '',
        fileUrl: data.fileUrl || null,
        pages: data.pages || 1,
        isDigital: data.isDigital ?? true,
        isbn: null,
        location: 'EL LEARN App Digital Library'
      }).onConflictDoNothing()
    })

    return { success: true, id }
  } catch (error: any) {
    console.error('Failed to create lesson note:', error)
    return { success: false, error: error.message || 'Failed to save lesson note' }
  }
}
