import DashboardLayout from '@/components/layout/dashboard-layout'
import UnifiedChat from '@/components/messaging/unified-chat'

export default function StudentMessagesPage() {
  return (
    <DashboardLayout role="student">
      <div className="p-4 md:p-8">
        <UnifiedChat role="student" />
      </div>
    </DashboardLayout>
  )
}
