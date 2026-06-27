import DashboardLayout from '@/components/layout/dashboard-layout'
import UnifiedChat from '@/components/messaging/unified-chat'
import { auth } from '@/lib/auth'

export default async function AdminMessagesPage() {
  const session = await auth.getSession()
  return (
    <DashboardLayout role="admin">
      <div className="p-4 md:p-8">
        <UnifiedChat role="admin" currentUserId={session?.user?.id || ''} />
      </div>
    </DashboardLayout>
  )
}
