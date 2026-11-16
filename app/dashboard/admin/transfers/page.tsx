import { requireDashboardRole } from '@/lib/auth/dashboard-access'
import { getTransferRequestsForSchool } from '@/app/actions/transfers'
import { TransferReviewList } from '@/components/transfers/TransferReviewList'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function AdminTransfersPage() {
  await requireDashboardRole(['SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN'])
  const requests = await getTransferRequestsForSchool()
  return <main className="mx-auto max-w-5xl space-y-6 p-6 md:p-10"><div><h1 className="text-3xl font-black">Institution transfers</h1><p className="mt-2 text-slate-600">Review requests addressed to your school. Approval moves the account and starts the 30-second previous school cleanup.</p></div><TransferReviewList requests={requests}/></main>
}
