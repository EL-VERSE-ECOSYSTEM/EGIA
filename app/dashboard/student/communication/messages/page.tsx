import DashboardLayout from '@/components/layout/dashboard-layout'
import UnifiedChat from '@/components/messaging/unified-chat'
import { auth } from '@/lib/auth'

export default async function StudentMessagesPage() {
  const session = await auth.getSession()
  return (
    <DashboardLayout role="student">
      <div className="p-4 md:p-8">
        <UnifiedChat role="student" currentUserId={session?.user?.id || ''} />
      </div>
    </DashboardLayout>
  )
}
