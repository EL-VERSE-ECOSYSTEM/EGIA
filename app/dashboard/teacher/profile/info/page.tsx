import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTeacherProfile } from '@/app/actions/user'

export const dynamic = 'force-dynamic'

export default async function TeacherProfileInfoPage() {
  const profile = await getTeacherProfile()
  const subjects = Array.isArray(profile?.teachingSubjects) ? profile.teachingSubjects as string[] : []
  const classes = Array.isArray(profile?.handlingClasses) ? profile.handlingClasses as string[] : []
  return <DashboardLayout role="teacher"><main className="mx-auto max-w-4xl space-y-8 p-4 sm:p-8"><div><h1 className="text-3xl font-black text-slate-900">Staff profile</h1><p className="mt-2 text-slate-500">Your teaching assignments and staff information from the school database.</p></div>{profile ? <Card className="rounded-3xl border-none shadow-xl"><CardHeader><CardTitle>{profile.firstName} {profile.lastName}</CardTitle><p className="text-sm text-slate-500">{profile.staffCode || 'Staff ID pending'} · {profile.type || 'FULL_TIME'}</p></CardHeader><CardContent className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Teaching subjects</p>{subjects.length ? <div className="mt-3 flex flex-wrap gap-2">{subjects.map(subject => <Badge key={subject} className="bg-purple-100 text-purple-800">{subject}</Badge>)}</div> : <p className="mt-2 text-slate-500">No teaching subjects assigned yet.</p>}</div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Handled classes</p>{classes.length ? <div className="mt-3 flex flex-wrap gap-2">{classes.map(item => <Badge key={item} variant="outline">{item}</Badge>)}</div> : <p className="mt-2 text-slate-500">No classes assigned yet.</p>}</div></CardContent></Card> : <Card><CardContent className="p-8 text-slate-600">Your staff profile is not available yet.</CardContent></Card>}</main></DashboardLayout>
}
