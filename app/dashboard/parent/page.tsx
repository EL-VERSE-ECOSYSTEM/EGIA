export const dynamic = "force-dynamic"
import DashboardLayout from '@/components/layout/dashboard-layout'
import ParentOverview from './overview/page'

export default function ParentPage() {
  return (
    <DashboardLayout role="parent">
      <ParentOverview />
    </DashboardLayout>
  )
}
