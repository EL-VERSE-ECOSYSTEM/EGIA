import DashboardLayout from '@/components/layout/dashboard-layout'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, assessmentResult, student, user } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function ClassLeaderboardPage() {
  const session = await auth.getSession()
  const account = session?.user ? await db.query.user.findFirst({ where: eq(user.id, session.user.id) }) : null
  const classes = account?.schoolId ? await db.select({ className: student.class, average: sql<string>`round(avg(${assessmentResult.score}::numeric), 2)::text`, learners: sql<number>`count(distinct ${student.id})::int`, assessments: sql<number>`count(${assessmentResult.id})::int` }).from(student).innerJoin(assessmentResult, eq(student.id, assessmentResult.studentId)).innerJoin(assessment, and(eq(assessment.id, assessmentResult.assessmentId), eq(assessment.schoolId, account.schoolId))).where(eq(student.schoolId, account.schoolId)).groupBy(student.class).orderBy(desc(sql`avg(${assessmentResult.score}::numeric)`)).limit(30) : []
  return <DashboardLayout role="student"><main className="mx-auto max-w-4xl space-y-6 p-6 md:p-10"><Link href="/dashboard/student/leaderboard" className="text-sm font-bold text-indigo-700">← Leaderboard</Link><div><h1 className="text-3xl font-black">Class rankings</h1><p className="mt-2 text-slate-600">Average completed assessment results for each class in your school.</p></div><div className="overflow-hidden rounded-2xl border bg-white">{classes.length ? classes.map((row, index) => <div key={row.className} className="flex items-center justify-between border-b p-5 last:border-0"><div><p className="font-bold">{index + 1}. {row.className}</p><p className="text-sm text-slate-500">{row.learners} learners · {row.assessments} results</p></div><strong className="text-xl text-indigo-700">{Number(row.average).toFixed(2)}%</strong></div>) : <p className="p-8 text-center text-slate-500">No class results are available yet.</p>}</div><Link href="/dashboard/student/leaderboard/subject" className="font-bold text-indigo-700">View subject rankings →</Link></main></DashboardLayout>
}
