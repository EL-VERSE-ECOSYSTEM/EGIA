import DashboardLayout from '@/components/layout/dashboard-layout'
import UnifiedChat from '@/components/messaging/unified-chat'

export default function AdminSentMessagesPage() {
  return (
    <DashboardLayout role="admin">
      <div className="p-4 md:p-8">
        <UnifiedChat role="admin" />
      </div>
    </DashboardLayout>
  )
}
