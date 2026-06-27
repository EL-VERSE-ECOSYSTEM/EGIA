import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardRedirect() {
  const session = await auth.getSession()

  if (!session) {
    console.log('No session found in redirect, going to signin')
    redirect('/auth/signin')
  }

  const role = session.user.role?.toUpperCase()
  console.log('User role for redirect:', role)

  if (role === 'ADMIN') {
    redirect('/dashboard/admin/overview')
  } else if (role === 'TEACHER') {
    redirect('/dashboard/teacher/overview')
  } else if (role === 'PARENT') {
    redirect('/dashboard/parent/overview')
  } else if (role === 'STUDENT') {
    redirect('/dashboard/student/overview')
  } else {
    console.log('Unknown role, going to setup-role or home')
    redirect('/setup-role')
  }
}
