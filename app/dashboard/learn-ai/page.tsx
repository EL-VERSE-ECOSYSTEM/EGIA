import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { LearnAiChatPage } from '@/components/learn-ai/LearnAiChatPage'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function LearnAiDashboardPage() {
  const session = await auth.getSession()
  if (!session?.user) redirect('/auth/signin')

  const rawRole = session.user.role.toUpperCase()
  const role = rawRole === 'SUPER_ADMIN'
    ? 'super-admin'
    : rawRole === 'TEACHER'
      ? 'teacher'
      : rawRole === 'PARENT'
        ? 'parent'
        : rawRole === 'STUDENT' || rawRole === 'PUPIL'
          ? 'student'
          : 'admin'

  return (
    <DashboardLayout role={role}>
      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Learning assistant</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Learn AI</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">School-aware learning guidance for students, families, teachers, and administrators.</p>
        </header>
        <LearnAiChatPage />
      </main>
    </DashboardLayout>
  )
}