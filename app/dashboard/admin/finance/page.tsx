import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function FinanceIndex() {
  const session = await auth.getSession()
  const user = session?.user as any
  const level = user?.adminLevel || 'PRIMARY_ADMIN'

  // Non PRIMARY_ADMIN levels are blocked from payments/finance
  if (user?.role === 'ADMIN' && level !== 'PRIMARY_ADMIN' && level !== 'SCHOOL_ADMIN') {
    redirect('/dashboard/admin/overview')
  }

  redirect('/dashboard/admin/finance/fees/structure')
}
