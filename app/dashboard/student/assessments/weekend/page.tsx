import Link from 'next/link'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { assessment, class_, student, teacherOnSubject } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WeekendAssessmentsPage() {
  const session = await auth.getSession()
  if (!session?.user) redirect('/auth/signin')
  if (session.user.role !== 'STUDENT' && session.user.role !== 'PUPIL') {
    redirect('/dashboard-redirect')
  }

  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id),
    columns: { id: true, schoolId: true, class: true },
  })
  if (!studentProfile) redirect('/dashboard-redirect')

  const now = new Date()
  const isWeekend = [0, 5, 6].includes(now.getDay())
  let items: Awaited<ReturnType<typeof db.query.assessment.findMany>> = []
  if (isWeekend && studentProfile.schoolId) {
    const classRecords = await db.select({ id: class_.id }).from(class_).where(and(
      eq(class_.schoolId, studentProfile.schoolId),
      eq(class_.name, studentProfile.class),
    ))
    const classIds = classRecords.map((record) => record.id)
    const subjectIds = classIds.length
      ? (await db.select({ subjectId: teacherOnSubject.subjectId })
          .from(teacherOnSubject)
          .where(inArray(teacherOnSubject.classId, classIds)))
          .map((record) => record.subjectId)
      : []

    if (subjectIds.length) {
      items = await db.query.assessment.findMany({
        where: and(
          eq(assessment.status, 'published'),
          eq(assessment.type, 'WEEKEND'),
          inArray(assessment.subjectId, subjectIds),
          or(eq(assessment.schoolId, studentProfile.schoolId), isNull(assessment.schoolId)),
        ),
        orderBy: [desc(assessment.createdAt)],
      })
    }
  }

  return <DashboardLayout role="student"><main className="mx-auto max-w-5xl p-4 sm:p-8 space-y-7"><div><h1 className="text-3xl font-black">Weekend assessments</h1><p className="mt-2 text-slate-600">Published assessments are available from Friday through Sunday.</p></div>{!isWeekend ? <Card><CardContent className="p-8 text-slate-600">Weekend assessments are currently closed. They reopen on Friday.</CardContent></Card> : items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map(item => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle><p className="text-sm text-slate-500">Assessment · {item.duration} minutes</p></CardHeader><CardContent><p className="mb-5 text-sm text-slate-600">{item.description || 'Complete this supervised weekend assessment.'}</p><Link href={`/dashboard/student/assessments/cbt/${item.id}/take`}><Button>Start assessment</Button></Link></CardContent></Card>)}</div> : <Card><CardContent className="p-8 text-slate-600">No weekend assessments have been published yet.</CardContent></Card>}</main></DashboardLayout>
}
