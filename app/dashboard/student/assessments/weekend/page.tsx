import Link from 'next/link'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { assessment } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { and, desc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function WeekendAssessmentsPage() {
  const now = new Date()
  const isWeekend = [0, 5, 6].includes(now.getDay())
  const items = isWeekend ? await db.query.assessment.findMany({
    where: and(eq(assessment.status, 'published'), eq(assessment.type, 'WEEKEND')),
    orderBy: [desc(assessment.createdAt)],
    with: { subject: true },
  }) : []

  return <DashboardLayout role="student"><main className="mx-auto max-w-5xl p-4 sm:p-8 space-y-7"><div><h1 className="text-3xl font-black">Weekend assessments</h1><p className="mt-2 text-slate-600">Published assessments are available from Friday through Sunday.</p></div>{!isWeekend ? <Card><CardContent className="p-8 text-slate-600">Weekend assessments are currently closed. They reopen on Friday.</CardContent></Card> : items.length ? <div className="grid gap-5 md:grid-cols-2">{items.map(item => <Card key={item.id}><CardHeader><CardTitle>{item.title}</CardTitle><p className="text-sm text-slate-500">{item.subject?.name || 'Assessment'} · {item.duration} minutes</p></CardHeader><CardContent><p className="mb-5 text-sm text-slate-600">{item.description || 'Complete this supervised weekend assessment.'}</p><Link href={`/dashboard/student/assessments/cbt/${item.id}/take`}><Button>Start assessment</Button></Link></CardContent></Card>)}</div> : <Card><CardContent className="p-8 text-slate-600">No weekend assessments have been published yet.</CardContent></Card>}</main></DashboardLayout>
}
