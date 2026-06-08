import DashboardLayout from '@/components/layout/dashboard-layout'
import TeacherOverview from './overview/page'

export default function TeacherPage() {
  return (
    <DashboardLayout role="teacher">
      <TeacherOverview />
    </DashboardLayout>
  )
}
