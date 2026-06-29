import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userRole, student, teacher, parent } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardRedirect() {
  const session = await auth.getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  const userId = session.user.id
  const roleRecord = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId)
  })

  if (!roleRecord) {
    redirect('/setup-role')
  }

  const role = roleRecord.role.toUpperCase()

  if (role === 'ADMIN') {
    redirect('/dashboard/admin/overview')
  }

  // Check for profiles to ensure they don't get stuck if registration was incomplete
  if (role === 'TEACHER') {
    const profile = await db.query.teacher.findFirst({
      where: eq(teacher.userId, userId)
    })
    if (!profile) redirect('/setup-role/teacher')
    redirect('/dashboard/teacher/overview')
  }

  if (role === 'PARENT') {
    const profile = await db.query.parent.findFirst({
      where: eq(parent.userId, userId)
    })
    if (!profile) redirect('/setup-role/parent')
    redirect('/dashboard/parent/overview')
  }

  if (role === 'STUDENT') {
    const profile = await db.query.student.findFirst({
      where: eq(student.userId, userId)
    })
    if (!profile) redirect('/setup-role/student')
    redirect('/dashboard/student/overview')
  }

  redirect('/setup-role')
}
