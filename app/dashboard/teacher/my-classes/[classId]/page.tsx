import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Calendar, ChevronRight } from 'lucide-react'
import { getStudentsInClass } from '@/app/actions/teacher'
import Link from 'next/link'

export default async function TeacherClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
   const { classId } = await params
   let students: any[] = []
  try {
    students = await getStudentsInClass(classId)
  } catch (e) {
    console.error(e)
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Class Roster</h1>
            <p className="text-slate-500 font-medium text-lg">Detailed visibility for all students in your assigned class.</p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="h-14 px-6 rounded-2xl border-2 border-purple-100 font-black text-purple-600 gap-2 shadow-sm">
                <Calendar size={18} /> TIMETABLE
             </Button>
             <Button className="h-14 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 font-black shadow-xl shadow-purple-200 gap-2">
                <GraduationCap size={20} /> CLASS REPORTS
             </Button>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
             <CardTitle className="text-2xl font-black text-slate-900">Assigned Students</CardTitle>
             <Badge className="bg-purple-600 text-white h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest">{students.length} ENROLLED</Badge>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Parent Contact</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Status</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.length === 0 ? (
                      <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">No students found or invalid class selection.</td></tr>
                    ) : students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="p-8">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center font-black text-purple-600 text-lg">
                                 {s.firstName?.[0]}{s.lastName?.[0]}
                              </div>
                              <div>
                                 <p className="text-lg font-black text-slate-900">{s.firstName} {s.lastName}</p>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.admissionNumber}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-8">
                           <p className="font-bold text-slate-900">{s.parent?.firstName} {s.parent?.lastName}</p>
                           <p className="text-xs font-medium text-slate-400 mt-1">{s.parent?.phoneNumber || 'No phone recorded'}</p>
                        </td>
                        <td className="p-8">
                           <div className="flex items-center gap-3">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{ width: '92%' }}></div>
                              </div>
                              <span className="text-xs font-black text-slate-900">92%</span>
                           </div>
                        </td>
                        <td className="p-8">
                           <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-4">EXCELLENT</Badge>
                        </td>
                        <td className="p-8 text-right">
                           <div className="flex justify-end gap-3">
                              <Link href={`/dashboard/teacher/my-classes/student/${s.id}`}>
                                <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-100 shadow-sm font-black text-slate-600 gap-2 hover:bg-slate-50">
                                   VIEW PROFILE <ChevronRight size={16} />
                                </Button>
                              </Link>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
