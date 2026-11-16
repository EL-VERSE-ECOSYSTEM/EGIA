import DashboardLayout from '@/components/layout/dashboard-layout'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attendance, class_, student, user } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function AttendanceLeaderboardPage() {
  const session = await auth.getSession()
  const account = session?.user ? await db.query.user.findFirst({ where: eq(user.id, session.user.id) }) : null
  const learner = account ? await db.query.student.findFirst({ where: eq(student.userId, account.id) }) : null
  const rows = learner && account?.schoolId ? await db.select({ id: attendance.id, date: attendance.date, status: attendance.status, className: class_.name }).from(attendance).innerJoin(class_, eq(class_.id, attendance.classId)).where(and(eq(attendance.studentId, learner.id), eq(class_.schoolId, account.schoolId))).orderBy(desc(attendance.date)).limit(40) : []
  const summary = rows.length ? Math.round(rows.filter((row) => /present|late/i.test(row.status)).length / rows.length * 100) : null
  return <DashboardLayout role="student"><main className="mx-auto max-w-4xl space-y-6 p-6 md:p-10"><Link href="/dashboard/student/leaderboard" className="text-sm font-bold text-indigo-700">← Leaderboard</Link><div><h1 className="text-3xl font-black">Attendance record</h1><p className="mt-2 text-slate-600">Your 40 most recent attendance entries at the current school.</p></div>{summary !== null && <div className="rounded-2xl bg-indigo-950 p-6 text-white"><p className="text-sm text-indigo-200">Recent attendance rate</p><p className="text-4xl font-black">{summary}%</p></div>}<div className="overflow-hidden rounded-2xl border bg-white">{rows.length ? rows.map((row) => <div key={row.id} className="flex items-center justify-between border-b p-4 last:border-0"><div><p className="font-bold">{row.className}</p><p className="text-sm text-slate-500">{row.date}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{row.status}</span></div>) : <p className="p-8 text-center text-slate-500">No attendance entries are available at this school yet.</p>}</div></main></DashboardLayout>
}
