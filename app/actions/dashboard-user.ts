'use server'

import { auth } from '@/lib/auth'

export async function getDashboardUserInfo() {
  const session = await auth.getSession()
  if (!session?.user) return null

  return {
    name: session.user.name || 'User',
    email: session.user.email || '',
    role: session.user.role || 'USER',
    schoolId: session.user.schoolId || null,
  }
}
