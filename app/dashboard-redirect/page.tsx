import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardRedirect() {
  const session = await auth.getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  const role = session.user.role

  switch (role) {
    case 'ADMIN':
      redirect('/dashboard/admin')
    case 'TEACHER':
      redirect('/dashboard/teacher')
    case 'PARENT':
      redirect('/dashboard/parent')
    case 'STUDENT':
      redirect('/dashboard/student')
    default:
      redirect('/')
  }
}
