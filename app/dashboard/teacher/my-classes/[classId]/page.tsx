'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Calendar, ChevronRight, BookOpen, Clock, Activity, Award, ArrowRight } from 'lucide-react'
import { getStudentsInClass } from '@/app/actions/teacher'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function TeacherClassDetailsPage() {
  const { classId } = useParams() as { classId: string }
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStudents = async () => {
    try {
      const data = await getStudentsInClass(classId)
      setStudents(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (classId) {
      fetchStudents()
    }
  }, [classId])

  // Subscriptions to keep the students list and scores synced in real time
  useRealtimeSubscription('student', () => {
    fetchStudents()
  })
  useRealtimeSubscription('assessment_result', () => {
    fetchStudents()
  })

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Class Roster</h1>
            <p className="text-slate-500 font-medium text-lg">
              Detailed visibility for all assigned students in real time.
            </p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="h-14 px-6 rounded-2xl border-2 border-purple-100 font-black text-purple-600 gap-2 shadow-sm">
                <Calendar size={18} /> TIMETABLE
             </Button>
             <Button className="h-14 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 font-black shadow-xl shadow-purple-200 gap-2 text-white">
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
             {loading ? (
               <div className="p-20 text-center font-bold text-slate-400">Loading roster...</div>
             ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registered Studies / Subjects</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">CBT Attempts & Scores</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Parent Contact</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.length === 0 ? (
                        <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">No students found or invalid class selection.</td></tr>
                      ) : students.map((s) => {
                        const subjects = Array.isArray(s.subjectsDone) ? s.subjectsDone as string[] : []
                        const attempts = s.results?.length || 0
                        const avgScore = s.results?.length > 0
                          ? Math.round(s.results.reduce((acc: number, r: any) => acc + parseFloat(r.score || '0'), 0) / s.results.length)
                          : null

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="p-8">
                               <div className="flex items-center gap-6">
                                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center font-black text-purple-600 text-lg uppercase">
                                     {s.firstName?.[0]}{s.lastName?.[0]}
                                  </div>
                                  <div>
                                     <p className="text-lg font-black text-slate-900">{s.firstName} {s.lastName}</p>
                                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.admissionNumber}</p>
                                  </div>
                                </div>
                            </td>
                            <td className="p-8 max-w-xs">
                               <div className="flex flex-wrap gap-1.5">
                                 {subjects.length === 0 ? (
                                   <span className="text-xs text-slate-400 font-bold italic">No registered subjects</span>
                                 ) : subjects.map((sub, idx) => (
                                   <Badge key={idx} variant="outline" className="border-purple-100 text-purple-700 bg-purple-50/30 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase">
                                     {sub}
                                   </Badge>
                                 ))}
                               </div>
                            </td>
                            <td className="p-8">
                               <div className="space-y-1">
                                 <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                   <Activity className="w-4 h-4 text-purple-600" />
                                   {attempts} CBT Attempt{attempts !== 1 ? 's' : ''}
                                 </p>
                                 {avgScore !== null ? (
                                   <div className="flex items-center gap-1.5">
                                     <span className="text-xs font-bold text-slate-400">Avg Score:</span>
                                     <Badge className={avgScore >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                                       {avgScore}%
                                     </Badge>
                                   </div>
                                 ) : (
                                   <p className="text-xs text-slate-400 font-bold italic">No attempts yet</p>
                                 )}
                               </div>
                            </td>
                            <td className="p-8">
                               <p className="font-bold text-slate-900">{s.parent?.firstName} {s.parent?.lastName}</p>
                               <p className="text-xs font-medium text-slate-400 mt-1">{s.parent?.phoneNumber || 'No phone recorded'}</p>
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
                        )
                      })}
                    </tbody>
                  </table>
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
