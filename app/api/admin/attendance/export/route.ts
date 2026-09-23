import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { teacherAttendance, teacher } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { sanitizeServerError } from '@/lib/errors'

const ALLOWED_ADMIN_ROLES = ['PRIMARY_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN']

export async function GET(req: NextRequest) {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const userRoleStr = (session.user.role || '').toUpperCase()
    if (!ALLOWED_ADMIN_ROLES.includes(userRoleStr)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const querySchoolId = searchParams.get('schoolId')
    const sessionSchoolId = session.user.schoolId

    let targetSchoolId = sessionSchoolId
    if (userRoleStr === 'SUPER_ADMIN') {
      targetSchoolId = querySchoolId || sessionSchoolId
    } else if (querySchoolId && sessionSchoolId && querySchoolId !== sessionSchoolId) {
      return NextResponse.json({ error: 'Forbidden: Access to specified school attendance is restricted.' }, { status: 403 })
    }

    if (!targetSchoolId) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 })
    }

    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const format = searchParams.get('format') || 'csv'

    const records = await db.query.teacherAttendance.findMany({
      where: and(
        eq(teacherAttendance.schoolId, targetSchoolId),
        eq(teacherAttendance.workDate, date)
      )
    })

    // Fetch teacher info
    const enriched: Array<any> = []
    for (const r of records) {
      const t = await db.query.teacher.findFirst({ where: eq(teacher.id, r.teacherId) })
      enriched.push({
        ...r,
        teacherName: t ? `${t.firstName} ${t.lastName}` : 'Teacher',
        staffCode: t?.staffCode || 'N/A',
      })
    }

    if (format === 'csv') {
      const headers = ['Teacher Name', 'Staff Code', 'Date', 'Status', 'Clock In', 'Clock Out', 'Total Minutes', 'Late Minutes', 'Notes']
      const rows = enriched.map(r => [
        `"${r.teacherName}"`,
        `"${r.staffCode}"`,
        `"${r.workDate}"`,
        `"${r.status}"`,
        `"${r.clockInAt ? new Date(r.clockInAt).toLocaleTimeString() : '--:--'}"`,
        `"${r.clockOutAt ? new Date(r.clockOutAt).toLocaleTimeString() : '--:--'}"`,
        `"${r.totalMinutes || 0}"`,
        `"${r.lateMinutes || 0}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ])

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Attendance_${date}.csv"`,
        },
      })
    }

    return NextResponse.json({ date, records: enriched })
  } catch (err: any) {
    const safeErr = sanitizeServerError('GET /api/admin/attendance/export', err, 'Export failed')
    return NextResponse.json({ error: safeErr.error, requestId: safeErr.requestId }, { status: 500 })
  }
}
