import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessmentSchedule, assessment, teacher as teacherTable, user as userTable } from '@/lib/db/schema'
import { eq, desc, inArray, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { sanitizeServerError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const role = (session.user.role || '').toUpperCase()
    if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 })
    }

    const body = await req.json()
    const { assessmentId, startTime, endTime, classId } = body

    if (!assessmentId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Assessment ID, start time, and end time are required.' }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time format provided.' }, { status: 400 })
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 })
    }

    // Verify assessment exists
    const existingAssessment = await db.query.assessment.findFirst({
      where: eq(assessment.id, assessmentId)
    })

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment record not found.' }, { status: 404 })
    }

    // Tenant and ownership isolation
    if (role !== 'SUPER_ADMIN') {
      let userSchoolId = session.user.schoolId || null

      if (!userSchoolId) {
        const userRecord = await db.query.user.findFirst({
          where: eq(userTable.id, session.user.id)
        })
        userSchoolId = userRecord?.schoolId || null
      }

      if (role === 'TEACHER') {
        const teacherProfile = await db.query.teacher.findFirst({
          where: eq(teacherTable.userId, session.user.id)
        })

        const teacherSchoolId = teacherProfile?.schoolId || userSchoolId
        const isCreator = teacherProfile && existingAssessment.createdBy === teacherProfile.id
        const isSameSchool = existingAssessment.schoolId && teacherSchoolId && existingAssessment.schoolId === teacherSchoolId

        if (!isCreator && !isSameSchool) {
          return NextResponse.json({
            error: 'Forbidden: You do not have permission to schedule this assessment.'
          }, { status: 403 })
        }
      } else {
        // ADMIN / SCHOOL_ADMIN
        if (existingAssessment.schoolId && existingAssessment.schoolId !== userSchoolId) {
          return NextResponse.json({
            error: 'Forbidden: Assessment belongs to a different school tenant.'
          }, { status: 403 })
        }
      }
    }

    const id = randomUUID()
    await db.insert(assessmentSchedule).values({
      id,
      assessmentId,
      startTime: start,
      endTime: end,
      classId: classId || null
    })

    return NextResponse.json({
      success: true,
      schedule: {
        id,
        assessmentId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        classId
      }
    })
  } catch (error: any) {
    const safeErr = sanitizeServerError('POST /api/teacher/assessments/schedule', error, 'Failed to schedule assessment.')
    return NextResponse.json({ error: safeErr.error, requestId: safeErr.requestId }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const role = (session.user.role || '').toUpperCase()
    if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'STUDENT'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')

    let list
    if (role === 'SUPER_ADMIN') {
      if (classId) {
        list = await db.select().from(assessmentSchedule).where(eq(assessmentSchedule.classId, classId)).orderBy(desc(assessmentSchedule.startTime))
      } else {
        list = await db.select().from(assessmentSchedule).orderBy(desc(assessmentSchedule.startTime))
      }
    } else {
      let userSchoolId = session.user.schoolId || null

      if (!userSchoolId) {
        const userRecord = await db.query.user.findFirst({
          where: eq(userTable.id, session.user.id)
        })
        userSchoolId = userRecord?.schoolId || null
      }

      if (!userSchoolId) {
        return NextResponse.json({ success: true, data: [] })
      }

      // Query assessments matching current user's schoolId
      const schoolAssessments = await db.query.assessment.findMany({
        where: eq(assessment.schoolId, userSchoolId),
        columns: { id: true }
      })

      const assessmentIds = schoolAssessments.map(a => a.id)

      if (assessmentIds.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      if (classId) {
        list = await db.select()
          .from(assessmentSchedule)
          .where(and(inArray(assessmentSchedule.assessmentId, assessmentIds), eq(assessmentSchedule.classId, classId)))
          .orderBy(desc(assessmentSchedule.startTime))
      } else {
        list = await db.select()
          .from(assessmentSchedule)
          .where(inArray(assessmentSchedule.assessmentId, assessmentIds))
          .orderBy(desc(assessmentSchedule.startTime))
      }
    }

    return NextResponse.json({ success: true, data: list })
  } catch (error: any) {
    const safeErr = sanitizeServerError('GET /api/teacher/assessments/schedule', error, 'Failed to fetch assessment schedules.')
    return NextResponse.json({ error: safeErr.error, requestId: safeErr.requestId }, { status: 500 })
  }
}
