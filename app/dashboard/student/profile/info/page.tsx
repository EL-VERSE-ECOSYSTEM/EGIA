import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStudentProfile } from '@/app/actions/user'

export const dynamic = 'force-dynamic'

export default async function StudentProfileInfoPage() {
  const profile = await getStudentProfile()
  const subjects = Array.isArray(profile?.subjectsDone) ? profile.subjectsDone as string[] : []
  return <DashboardLayout role="student"><main className="mx-auto max-w-4xl space-y-8 p-4 sm:p-8"><div><h1 className="text-3xl font-black text-slate-900">My profile</h1><p className="mt-2 text-slate-500">Your registered learner information from the school database.</p></div>{profile ? <><Card className="rounded-3xl border-none shadow-xl"><CardHeader><CardTitle>{profile.firstName} {profile.middleName ? `${profile.middleName} ` : ''}{profile.lastName}</CardTitle><p className="text-sm text-slate-500">{profile.admissionNumber || 'Admission number pending'} · {profile.class}</p></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Class</p><p className="mt-1 font-semibold">{profile.class}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</p><p className="mt-1 font-semibold">{profile.department || 'Not applicable'}</p></div><div className="sm:col-span-2"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subjects entered during Session Registration</p>{subjects.length ? <div className="mt-3 flex flex-wrap gap-2">{subjects.map(subject => <Badge key={subject} className="bg-orange-100 text-orange-800">{subject}</Badge>)}</div> : <p className="mt-2 text-slate-500">No subjects have been recorded yet. Contact the school office to update your registration.</p>}</div></CardContent></Card></> : <Card><CardContent className="p-8 text-slate-600">Your learner profile is not available yet.</CardContent></Card>}</main></DashboardLayout>
}
