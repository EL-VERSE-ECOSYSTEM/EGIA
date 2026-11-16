import DashboardLayout from '@/components/layout/dashboard-layout'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, studentBadges, user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Award } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function BadgesPage() {
  const session = await auth.getSession()
  const account = session?.user ? await db.query.user.findFirst({ where: eq(user.id, session.user.id) }) : null
  const learner = account ? await db.query.student.findFirst({ where: eq(student.userId, account.id) }) : null
  const badges = learner ? await db.select().from(studentBadges).where(eq(studentBadges.studentId, learner.id)).orderBy(desc(studentBadges.awardedAt)).limit(100) : []
  return <DashboardLayout role="student"><main className="mx-auto max-w-4xl space-y-6 p-6 md:p-10"><Link href="/dashboard/student/leaderboard" className="text-sm font-bold text-indigo-700">← Leaderboard</Link><div><h1 className="text-3xl font-black">My badges</h1><p className="mt-2 text-slate-600">Awards earned for your learning achievements.</p></div>{badges.length ? <div className="grid gap-4 sm:grid-cols-2">{badges.map((badge) => <article key={badge.id} className="flex items-start gap-4 rounded-2xl border bg-white p-5"><div className="rounded-xl bg-amber-50 p-3 text-amber-600"><Award/></div><div><p className="font-bold">{badge.badgeName}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{badge.badgeType}</p>{badge.reason && <p className="mt-2 text-sm text-slate-600">{badge.reason}</p>}<p className="mt-2 text-xs text-slate-400">{new Date(badge.awardedAt).toLocaleDateString()}</p></div></article>)}</div> : <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">No badges have been awarded yet. Keep learning and check back.</div>}</main></DashboardLayout>
}
