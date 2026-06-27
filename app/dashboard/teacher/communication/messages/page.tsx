import DashboardLayout from '@/components/layout/dashboard-layout'
import UnifiedChat from '@/components/messaging/unified-chat'

export default function TeacherMessagesPage() {
  return (
    <DashboardLayout role="teacher">
      <div className="p-4 md:p-8">
        <UnifiedChat role="teacher" />
      </div>
    </DashboardLayout>
  )
}
