import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStudentFullProfile } from '@/app/actions/teacher'
import { Mail, Phone, AlertCircle } from 'lucide-react'

export default async function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const student = await getStudentFullProfile(studentId)

  if (!student) {
    return (
      <DashboardLayout role="teacher">
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">Student Not Found</h2>
        </div>
      </DashboardLayout>
    )
  }

  const attendanceRate = student.attendance.length > 0
    ? Math.round((student.attendance.filter((a: any) => a.status === 'present').length / student.attendance.length) * 100)
    : 0

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-purple-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-purple-200">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{student.firstName} {student.lastName}</h1>
            <div className="flex gap-3 mt-2">
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-4 py-1 font-black">
                {student.class}
              </Badge>
              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none px-4 py-1 font-black uppercase tracking-widest">
                {student.admissionNumber}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Parent / Guardian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xl font-black text-slate-900">{student.parent?.firstName} {student.parent?.lastName}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <Phone size={16} /> <span>{student.parent?.phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <Mail size={16} /> <span>{student.parent?.user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <p className="text-5xl font-black text-slate-900">{attendanceRate}%</p>
                <p className="text-slate-400 font-bold mb-1 uppercase tracking-tighter text-xs">Term Average</p>
              </div>
              <div className="mt-6 w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${attendanceRate}%` }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Academic Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-emerald-500 text-white border-none font-black px-6 py-2 rounded-xl text-lg">
                GOOD STANDING
              </Badge>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Last updated: Today</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-xl font-black text-slate-900">Recent Assessment Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {student.results.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic">No assessment results recorded yet.</td></tr>
                ) : student.results.map((r: any) => (
                  <tr key={r.id}>
                    <td className="p-6">
                      <p className="font-black text-slate-900">{r.assessment?.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.assessment?.type}</p>
                    </td>
                    <td className="p-6 text-slate-500 font-bold text-sm">
                      {new Date(r.createdAt!).toLocaleDateString()}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">{r.score}</span>
                        <span className="text-slate-300 font-black">/</span>
                        <span className="text-sm font-bold text-slate-400">100</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <Badge className={r.score >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                        {r.score >= 50 ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
