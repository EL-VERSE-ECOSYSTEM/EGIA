import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getUserRole } from '@/app/actions/user'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  try {
    const role = await getUserRole()

    // Route to appropriate dashboard based on role
    if (role === 'admin') {
      redirect('/admin')
    } else if (role === 'teacher') {
      redirect('/teacher')
    } else if (role === 'student') {
      redirect('/student')
    } else if (role === 'parent') {
      redirect('/parent')
    } else {
      // User has no role yet, show role selection
      redirect('/setup-role')
    }
  } catch {
    // On error, show role selection
    redirect('/setup-role')
  }
}
