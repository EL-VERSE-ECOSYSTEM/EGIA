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
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      redirect('/auth/signin?error=Please sign in to continue')
    }

    // Check if user has explicit role record in Supabase userRole table or identities
    const role = (session.user.role || '').toUpperCase()

    if (!role || role === 'NONE') {
      redirect('/setup-role')
    }

    switch (role) {
      case 'SUPER_ADMIN':
        redirect('/dashboard/super-admin/overview')

      case 'SCHOOL_ADMIN':
      case 'ADMIN':
        redirect('/dashboard/admin/overview')

      case 'TEACHER': {
        let profile: any = null
        try {
          profile = await getTeacherProfile(session.user.id)
          if (!profile) {
            profile = await createTeacherProfile({})
          }
        } catch (e) {
          console.warn('Teacher profile resolution error in DashboardRedirect:', e)
        }
        redirect(profile ? '/dashboard/teacher/overview' : '/setup-role/teacher')
      }

      case 'PARENT': {
        let profile: any = null
        try {
          profile = await getParentProfile(session.user.id)
          if (!profile) {
            profile = await createParentProfile({})
          }
        } catch (e) {
          console.warn('Parent profile resolution error in DashboardRedirect:', e)
        }
        redirect('/dashboard/parent/overview')
      }

      case 'STUDENT':
      case 'PUPIL': {
        let profile: any = null
        try {
          profile = await getStudentProfile(session.user.id)
          if (!profile) {
            profile = await createStudentProfile({})
          }
        } catch (e) {
          console.warn('Student profile resolution error in DashboardRedirect:', e)
        }
        redirect(profile ? '/dashboard/student/overview' : '/setup-role/student')
      }

      default:
        redirect('/setup-role')
    }
  } catch (err: any) {
    if (
      err?.digest?.startsWith('NEXT_REDIRECT') ||
      err?.message === 'NEXT_REDIRECT' ||
      err?.name === 'RedirectError'
    ) {
      throw err
    }

    console.error('DashboardRedirect uncaught exception:', err)
    redirect('/auth/signin?error=Dashboard redirection error. Please sign in again.')
  }
}
