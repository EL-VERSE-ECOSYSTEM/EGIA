import DashboardLayout from '@/components/layout/dashboard-layout'
import UnifiedChat from '@/components/messaging/unified-chat'

export default function ParentMessagesPage() {
  return (
    <DashboardLayout role="parent">
      <div className="p-4 md:p-8">
        <UnifiedChat role="parent" />
      </div>
    </DashboardLayout>
  )
}
