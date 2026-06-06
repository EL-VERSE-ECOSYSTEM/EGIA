import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getUserRole } from '@/app/actions/user'

export default async function DashboardRedirect() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  try {
    const role = await getUserRole()

    if (role === 'admin') {
      redirect('/dashboard/admin/overview')
    } else if (role === 'teacher') {
      redirect('/dashboard/teacher/overview')
    } else if (role === 'student') {
      redirect('/dashboard/student/overview')
    } else if (role === 'parent') {
      redirect('/dashboard/parent/overview')
    } else {
      redirect('/setup-role')
    }
  } catch {
    redirect('/setup-role')
  }
}
