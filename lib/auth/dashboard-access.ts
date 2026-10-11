import 'server-only'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export async function requireDashboardRole(allowedRoles: readonly string[]) {
  const session = await auth.getSession()
  if (!session?.user) redirect('/auth/signin')

  const role = (session.user.role || '').toUpperCase()
  if (!allowedRoles.includes(role)) redirect('/dashboard-redirect')

  return session.user
}