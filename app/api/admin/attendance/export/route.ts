import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { teacherAttendance, teacher } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const format = searchParams.get('format') || 'csv'

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 })
    }

    const records = await db.query.teacherAttendance.findMany({
      where: and(
        eq(teacherAttendance.schoolId, schoolId),
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
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 })
  }
}
