import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  getParentProfile,
  getStudentProfile,
  getTeacherProfile,
  createTeacherProfile,
  createStudentProfile,
  createParentProfile,
} from '@/app/actions/user'

export const dynamic = 'force-dynamic'

/** Routes all roles to their respective dashboards based on Supabase database roles. */
export default async function DashboardRedirect() {
  const session = await auth.getSession()
  if (!session?.user) {
    redirect('/auth/signin?error=Please sign in to continue')
  }

  const role = session.user.role?.toUpperCase()

  switch (role) {
    case 'SUPER_ADMIN':
      redirect('/dashboard/super-admin/overview')

    case 'SCHOOL_ADMIN':
    case 'ADMIN':
      redirect('/dashboard/admin/overview')

    case 'TEACHER': {
      let profile: any = await getTeacherProfile(session.user.id)
      if (!profile) {
        try {
          profile = await createTeacherProfile({})
        } catch {
          // ignore error and proceed
        }
      }
      redirect(profile ? '/dashboard/teacher/overview' : '/setup-role/teacher')
    }

    case 'PARENT': {
      let profile: any = await getParentProfile(session.user.id)
      if (!profile) {
        try {
          profile = await createParentProfile({})
        } catch {
          // ignore error and proceed
        }
      }
      redirect('/dashboard/parent/overview')
    }

    case 'STUDENT': {
      let profile: any = await getStudentProfile(session.user.id)
      if (!profile) {
        try {
          profile = await createStudentProfile({})
        } catch {
          // ignore error and proceed
        }
      }
      redirect(profile ? '/dashboard/student/overview' : '/setup-role/student')
    }

    default:
      redirect('/dashboard/student/overview')
  }
}
