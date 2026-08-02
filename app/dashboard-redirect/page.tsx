import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getParentProfile, getStudentProfile, getTeacherProfile } from '@/app/actions/user'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { generateAdmissionNumber } from '@/lib/id'

export const dynamic = 'force-dynamic'

export default async function DashboardRedirect() {
  let session: any = null
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
      let profile = await getTeacherProfile(session.user.id)
      if (!profile) {
        try {
          const { db } = await import('@/lib/db')
          const { teacher } = await import('@/lib/db/schema')
          const nameParts = (session.user.name || 'Teacher').split(' ')
          const firstName = nameParts[0] || 'Teacher'
          const lastName = nameParts.slice(1).join(' ') || 'User'
          const staffCode = `EGIA-ST-${Math.floor(100000 + Math.random() * 900000)}`

          await db.insert(teacher).values({
            id: require('crypto').randomUUID(),
            userId: session.user.id,
            firstName,
            lastName,
            staffCode,
          }).onConflictDoNothing()
          profile = await getTeacherProfile(session.user.id)
        } catch (err) {
          console.error("DashboardRedirect: Failed to auto-create teacher profile:", err)
        }
      }
      redirect('/dashboard/teacher/overview')
    }

    if (role === 'PARENT') {
      let profile = await getParentProfile(session.user.id)
      if (!profile) {
        try {
          const { db } = await import('@/lib/db')
          const { parent } = await import('@/lib/db/schema')
          const nameParts = (session.user.name || 'Parent').split(' ')
          const firstName = nameParts[0] || 'Parent'
          const lastName = nameParts.slice(1).join(' ') || 'User'

          await db.insert(parent).values({
            id: require('crypto').randomUUID(),
            userId: session.user.id,
            firstName,
            lastName,
          }).onConflictDoNothing()
          profile = await getParentProfile(session.user.id)
        } catch (err) {
          console.error("DashboardRedirect: Failed to auto-create parent profile:", err)
        }
      }
      redirect('/dashboard/parent/overview')
    }

    if (role === 'STUDENT') {
      let profile = await getStudentProfile(session.user.id)
      if (!profile) {
        try {
          const { db } = await import('@/lib/db')
          const { student } = await import('@/lib/db/schema')
          const nameParts = (session.user.name || 'Student').split(' ')
          const firstName = nameParts[0] || 'Student'
          const lastName = nameParts.slice(1).join(' ') || 'User'
          const admissionNumber = generateAdmissionNumber('JSS1')

          await db.insert(student).values({
            id: require('crypto').randomUUID(),
            userId: session.user.id,
            firstName,
            lastName,
            class: 'JSS1',
            admissionNumber,
          }).onConflictDoNothing()
          profile = await getStudentProfile(session.user.id)
        } catch (err) {
          console.error("DashboardRedirect: Failed to auto-create student profile:", err)
        }
      }
      redirect('/dashboard/student/overview')
    }
  } catch (error) {
    console.error(`DashboardRedirect: Profile loading/auto-creation failed for user id ${session.user.id}:`, error)
    redirect('/setup-role')
  }

  // If no role or profile found
  redirect('/setup-role')
}
