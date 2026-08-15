'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, ChevronRight, Activity, Phone, Mail, Search } from 'lucide-react'
import { getStudentsInClass } from '@/app/actions/teacher'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ClassStudentsPage() {
  const params = useParams()
  const classId = (params?.classId as string) || ''
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchStudents = async () => {
    if (!classId) return
    try {
      const data = await getStudentsInClass(classId)
      setStudents(data || [])
    } catch (e) {
      console.error('Failed to load class students:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [classId])

  // Real-time Supabase Database Sync for Students & Assessment Results
  useRealtimeSubscription('student', () => { fetchStudents() })
  useRealtimeSubscription('assessment_result', () => { fetchStudents() })
  useRealtimeSubscription('attendance', () => { fetchStudents() })

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const adm = (s.admissionNumber || '').toLowerCase()
    return fullName.includes(search.toLowerCase()) || adm.includes(search.toLowerCase())
  })

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Class Students Roster</h1>
            <p className="text-slate-500 font-medium">Real-time profile, performance, and contact details for assigned class learners.</p>
          </div>
          <Badge className="bg-purple-600 text-white px-5 py-2 font-black text-xs uppercase tracking-widest rounded-xl">
            {students.length} Learners Enrolled
          </Badge>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search students by name or admission number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-800"
            />
          </div>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-20 text-center font-bold text-slate-400">Loading student profiles in real time...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold">No students found matching search criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Subjects</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">CBT Attempts</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent / Guardian</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((s) => {
                      const subjects = Array.isArray(s.subjectsDone) ? s.subjectsDone as string[] : []
                      const attempts = s.results?.length || 0
                      const avgScore = s.results?.length > 0
                        ? Math.round(s.results.reduce((acc: number, r: any) => acc + parseFloat(r.score || '0'), 0) / s.results.length)
                        : null

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-purple-100 font-black text-purple-700 flex items-center justify-center text-base">
                                {s.firstName?.[0]}{s.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-lg">{s.firstName} {s.lastName}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.admissionNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-8 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {subjects.length === 0 ? (
                                <span className="text-xs text-slate-400 italic">No registered subjects</span>
                              ) : subjects.slice(0, 4).map((sub, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] font-bold border-purple-100 text-purple-700 bg-purple-50/50">
                                  {sub}
                                </Badge>
                              ))}
                              {subjects.length > 4 && (
                                <span className="text-[10px] font-bold text-slate-400">+{subjects.length - 4} more</span>
                              )}
                            </div>
                          </td>
                          <td className="p-8">
                            <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 text-purple-600" />
                              {attempts} attempt{attempts !== 1 ? 's' : ''}
                            </p>
                            {avgScore !== null && (
                              <Badge className={avgScore >= 50 ? 'bg-emerald-100 text-emerald-800 border-none font-black text-[10px] mt-1' : 'bg-red-100 text-red-800 border-none font-black text-[10px] mt-1'}>
                                Avg: {avgScore}%
                              </Badge>
                            )}
                          </td>
                          <td className="p-8">
                            <p className="font-bold text-slate-800 text-sm">{s.parent?.firstName} {s.parent?.lastName}</p>
                            <p className="text-xs text-slate-400 font-medium">{s.parent?.phoneNumber || 'No phone'}</p>
                          </td>
                          <td className="p-8 text-right">
                            <Link href={`/dashboard/teacher/my-classes/student/${s.id}`}>
                              <Button variant="outline" className="h-10 px-4 rounded-xl font-black text-xs gap-1 border-slate-200">
                                PROFILE <ChevronRight size={14} />
                              </Button>
                            </Link>
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
