import DashboardLayout from '@/components/layout/dashboard-layout'
import UnifiedChat from '@/components/messaging/unified-chat'
import { auth } from '@/lib/auth'

export default async function TeacherMessagesPage() {
  const session = await auth.getSession()
  return (
    <DashboardLayout role="teacher">
      <div className="p-4 md:p-8">
        <UnifiedChat role="teacher" currentUserId={session?.user?.id || ''} />
      </div>
    </DashboardLayout>
  )
}
