import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getParentProfile, getStudentProfile, getTeacherProfile } from '@/app/actions/user'

export const dynamic = 'force-dynamic'

/** Routes only verified roles to their real dashboard. It never invents profiles or IDs. */
export default async function DashboardRedirect() {
  const session = await auth.getSession()
  if (!session?.user) redirect('/auth/signin?error=Please sign in to continue')

  switch (session.user.role?.toUpperCase()) {
    case 'ADMIN': redirect('/dashboard/admin/overview')
    case 'TEACHER': {
      const profile = await getTeacherProfile(session.user.id)
      redirect(profile ? '/dashboard/teacher/overview' : '/setup-role/teacher')
    }
    case 'PARENT': {
      const profile = await getParentProfile(session.user.id)
      redirect(profile ? '/dashboard/parent/overview' : '/setup-role/parent')
    }
    case 'STUDENT': {
      const profile = await getStudentProfile(session.user.id)
      redirect(profile ? '/dashboard/student/overview' : '/setup-role/student')
    }
    default: redirect('/setup-role')
  }
}
