import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { parent, student } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { TransferRequestForm } from '@/components/transfers/TransferRequestForm'

export const dynamic = 'force-dynamic'

export default async function TransferPage() {
  const session = await auth.getSession()
  if (!session?.user) return null
  const role = (session.user.role || 'student').toLowerCase()
  let wards: { id: string; name: string }[] = []
  if (role === 'parent') {
    const profile = await db.query.parent.findFirst({ where: eq(parent.userId, session.user.id) })
    if (profile) wards = (await db.query.student.findMany({ where: eq(student.parentId, profile.id) })).map((ward) => ({ id: ward.id, name: `${ward.firstName} ${ward.lastName} · ${ward.class}` }))
  }
  const dashboardRole = role === 'teacher' ? 'teacher' : role === 'parent' ? 'parent' : role === 'super_admin' ? 'super-admin' : 'student'
  return <DashboardLayout role={dashboardRole}><main className="mx-auto max-w-3xl space-y-6 p-6 md:p-10"><div><h1 className="text-3xl font-black">Institution transfer</h1><p className="mt-2 text-slate-600">Request a move to another registered school. The destination administrator must approve the request.</p></div><TransferRequestForm wards={wards}/><p className="text-sm text-slate-500">After approval, previous school records are cleared within 30 seconds. Report cards remain available. Teachers are marked pending until the new school confirms their placement.</p></main></DashboardLayout>
}
