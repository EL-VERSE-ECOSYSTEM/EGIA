import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getParentProfile, getStudentProfile, getTeacherProfile } from '@/app/actions/user'

export default async function DashboardRedirect() {
  let session = null
  try {
    session = await auth.getSession()
  } catch (error) {
    console.error("DashboardRedirect: auth.getSession() threw error:", error)
  }

  if (!session) {
    redirect('/auth/signin')
  }

  const role = session.user.role?.toUpperCase()

  try {
    if (role === 'ADMIN') {
      redirect('/dashboard/admin/overview')
    }

    if (role === 'TEACHER') {
      const profile = await getTeacherProfile(session.user.id)
      if (!profile) redirect('/setup-role/teacher')
      redirect('/dashboard/teacher/overview')
    }

    if (role === 'PARENT') {
      const profile = await getParentProfile(session.user.id)
      if (!profile) redirect('/setup-role/parent')
      redirect('/dashboard/parent/overview')
    }

    if (role === 'STUDENT') {
      const profile = await getStudentProfile(session.user.id)
      if (!profile) redirect('/setup-role/student')
      redirect('/dashboard/student/overview')
    }
  } catch (error) {
    console.error(`DashboardRedirect: Profile loading failed for user id ${session.user.id}:`, error)
    // Fall back to setup-role selection if profiles cannot be resolved or if database is temporarily down
    redirect('/setup-role')
  }

  // If no role or profile found
  redirect('/setup-role')
}
