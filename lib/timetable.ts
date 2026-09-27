export interface TimetableEntry {
  id?: string
  dayOfWeek: string
  periodNumber: number
  startTime: string
  endTime: string
  subjectName: string
  teacherName?: string
  room?: string
}

export const ALLOWED_TIMETABLE_ROLES = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
export const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function canModifyTimetableRole(role?: string | null): boolean {
  if (!role) return false
  return ALLOWED_TIMETABLE_ROLES.includes(role.toUpperCase())
}

export function validateAndSanitizeTimetableEntry(e: Partial<TimetableEntry>, schoolId: string, className: string) {
  const rawDay = (e.dayOfWeek || 'Monday').trim()
  const dayOfWeek = VALID_DAYS.find(d => d.toLowerCase() === rawDay.toLowerCase()) || 'Monday'

  const rawPeriod = Number(e.periodNumber)
  const periodNumber = Number.isInteger(rawPeriod) && rawPeriod >= 1 && rawPeriod <= 20 ? rawPeriod : 1

  const startTime = (e.startTime || '08:00').trim().slice(0, 20)
  const endTime = (e.endTime || '08:40').trim().slice(0, 20)
  const subjectName = (e.subjectName || 'Free Period').trim().slice(0, 100)
  const teacherName = e.teacherName && e.teacherName.trim() ? e.teacherName.trim().slice(0, 100) : null
  const room = e.room && e.room.trim() ? e.room.trim().slice(0, 50) : null

  return {
    schoolId,
    className,
    dayOfWeek,
    periodNumber,
    startTime,
    endTime,
    subjectName,
    teacherName,
    room,
    updatedAt: new Date()
  }
}
