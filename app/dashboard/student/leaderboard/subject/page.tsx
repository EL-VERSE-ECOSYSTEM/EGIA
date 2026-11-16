import DashboardLayout from '@/components/layout/dashboard-layout'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, assessmentResult, student, subject, user } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function SubjectLeaderboardPage() {
  const session = await auth.getSession()
  const account = session?.user ? await db.query.user.findFirst({ where: eq(user.id, session.user.id) }) : null
  const learner = account ? await db.query.student.findFirst({ where: eq(student.userId, account.id) }) : null
  const rows = account?.schoolId ? await db.select({ subjectName: subject.name, average: sql<string>`round(avg(${assessmentResult.score}::numeric), 2)::text`, learners: sql<number>`count(distinct ${student.id})::int`, assessments: sql<number>`count(${assessmentResult.id})::int` }).from(student).innerJoin(assessmentResult, eq(student.id, assessmentResult.studentId)).innerJoin(assessment, and(eq(assessment.id, assessmentResult.assessmentId), eq(assessment.schoolId, account.schoolId))).innerJoin(subject, eq(subject.id, assessment.subjectId)).where(learner?.class ? and(eq(student.schoolId, account.schoolId), eq(student.class, learner.class)) : eq(student.schoolId, account.schoolId)).groupBy(subject.name).orderBy(desc(sql`avg(${assessmentResult.score}::numeric)`)).limit(40) : []
  return <DashboardLayout role="student"><main className="mx-auto max-w-4xl space-y-6 p-6 md:p-10"><Link href="/dashboard/student/leaderboard" className="text-sm font-bold text-indigo-700">← Leaderboard</Link><div><h1 className="text-3xl font-black">Subject rankings</h1><p className="mt-2 text-slate-600">Average assessment results by subject{learner?.class ? ` for ${learner.class}` : ''} at your school.</p></div><div className="overflow-hidden rounded-2xl border bg-white">{rows.length ? rows.map((row, index) => <div key={row.subjectName} className="flex items-center justify-between border-b p-5 last:border-0"><div><p className="font-bold">{index + 1}. {row.subjectName}</p><p className="text-sm text-slate-500">{row.learners} learners · {row.assessments} results</p></div><strong className="text-xl text-indigo-700">{Number(row.average).toFixed(2)}%</strong></div>) : <p className="p-8 text-center text-slate-500">No subject results are available yet.</p>}</div><Link href="/dashboard/student/leaderboard/class" className="font-bold text-indigo-700">View class rankings →</Link></main></DashboardLayout>
}
