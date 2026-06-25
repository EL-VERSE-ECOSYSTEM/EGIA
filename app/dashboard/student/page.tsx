export const dynamic = "force-dynamic"
import DashboardLayout from '@/components/layout/dashboard-layout'
import StudentOverview from './overview/page'

export default function StudentPage() {
  return (
    <DashboardLayout role="student">
      <StudentOverview />
    </DashboardLayout>
  )
}
