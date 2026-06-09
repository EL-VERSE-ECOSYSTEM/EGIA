import DashboardLayout from '@/components/layout/dashboard-layout'
import AdminOverview from './overview/page'

export default function AdminPage() {
  return (
    <DashboardLayout role="admin">
      <AdminOverview />
    </DashboardLayout>
  )
}
