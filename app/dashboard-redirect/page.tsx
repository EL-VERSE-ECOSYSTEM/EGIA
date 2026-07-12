import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getParentProfile, getStudentProfile, getTeacherProfile } from '@/app/actions/user'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function DashboardRedirect() {
  let session = null
  try {
    session = await auth.getSession()
  } catch (error) {
    console.error("DashboardRedirect: auth.getSession() threw error:", error)
  }

  if (!session) {
    // To prevent infinite redirect loop on the client side, we must sign out the user
    // from Supabase Auth so that middleware doesn't keep redirecting them back here
    try {
      const cookieStore = await cookies()
      const supabase = createClient(cookieStore)
      await supabase.auth.signOut()
    } catch (signOutError) {
      console.error("DashboardRedirect: signOut failed:", signOutError)
    }
    redirect('/auth/signin?error=Session expired or query failed')
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
