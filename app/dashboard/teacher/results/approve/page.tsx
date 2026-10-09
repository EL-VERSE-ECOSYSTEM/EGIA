'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Award, Search, Filter, Loader2, CheckCircle2, Clock, BookOpen, GraduationCap, Sparkles } from 'lucide-react'
import { getTeacherClassResultsAction } from '@/app/actions/teacher'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function TeacherResultsPage() {
  const [resultsData, setResultsData] = useState<any[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [teacherType, setTeacherType] = useState<string>('FULL_TIME')
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('ALL')
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  const loadResults = async () => {
    try {
      const data = await getTeacherClassResultsAction()
      setResultsData(data.results || [])
      setClasses(data.classes || [])
      setSubjects(data.subjects || [])
      setTeacherType(data.teacherType || 'FULL_TIME')
    } catch (err) {
      console.error('Failed to load teacher results:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [])

  useRealtimeSubscription('assessment_result', () => { loadResults() })

  const filteredResults = resultsData.filter((r) => {
    const studentName = `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.toLowerCase()
    const admissionNo = (r.student?.admissionNumber || '').toLowerCase()
    const query = searchQuery.toLowerCase()

    const matchesSearch = studentName.includes(query) || admissionNo.includes(query)
    const matchesClass = selectedClass === 'ALL' || r.student?.class === selectedClass
    const matchesSubject = selectedSubject === 'ALL' || r.assessment?.subject?.name === selectedSubject
    const matchesType = typeFilter === 'ALL' || (r.assessment?.type || 'ASSESSMENT_CBT').toUpperCase() === typeFilter.toUpperCase()

    return matchesSearch && matchesClass && matchesSubject && matchesType
  })

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider mb-3">
            <GraduationCap className="w-4 h-4" /> ACADEMIC PERFORMANCE LEDGER
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Student Assessment & CBT Results
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Real-time evaluation ledger for Weekend Assignments, Assessments, and CBT Exams across your registered classes and subjects ({teacherType === 'PART_TIME' ? 'Part-Time Subject Assigned' : 'Full-Time Class Assigned'}).
          </p>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search student or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl text-xs font-bold border-slate-200"
              />
            </div>

            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-700"
              >
                <option value="ALL">All Assigned Classes ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-700"
              >
                <option value="ALL">All Taught Subjects ({subjects.length})</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-700"
              >
                <option value="ALL">All Evaluation Types</option>
                <option value="WEEKEND_ASSIGNMENT">Weekend Assignment</option>
                <option value="ASSESSMENT_CBT">Assessment CBT</option>
                <option value="EXAM_CBT">Exam CBT</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results Table */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <th className="p-6">Student / Admission No</th>
                    <th className="p-6">Class</th>
                    <th className="p-6">Evaluation Title & Subject</th>
                    <th className="p-6">Category</th>
                    <th className="p-6">Score</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Date Graded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center text-slate-400 font-bold italic">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                        Fetching student results in real time...
                      </td>
                    </tr>
                  ) : filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center text-slate-400 font-bold italic">
                        No evaluation results recorded matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((item) => {
                      const scoreVal = parseFloat(item.score || '0')
                      const isPassed = scoreVal >= 50

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-6">
                            <p className="font-black text-slate-900 text-sm">
                              {item.student?.firstName} {item.student?.lastName}
                            </p>
                            <p className="text-[10px] font-mono font-bold text-slate-400">
                              {item.student?.admissionNumber || 'N/A'}
                            </p>
                          </td>
                          <td className="p-6">
                            <Badge className="bg-slate-100 text-slate-700 font-black border-none px-3 py-1 text-xs">
                              {item.student?.class || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-6">
                            <p className="font-bold text-slate-800 text-xs">{item.assessment?.title || 'General Assessment'}</p>
                            <p className="text-[10px] font-black text-blue-600 uppercase mt-0.5">
                              {item.assessment?.subject?.name || 'General Subject'}
                            </p>
                          </td>
                          <td className="p-6">
                            <Badge className="bg-purple-50 text-purple-700 font-black border-none px-2.5 py-1 text-[10px] uppercase">
                              {(item.assessment?.type || 'ASSESSMENT').replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-6">
                            <p className={`font-black text-base font-mono ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {scoreVal.toFixed(1)}%
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              {item.correctAnswers} / {item.totalQuestions} Questions
                            </p>
                          </td>
                          <td className="p-6">
                            {isPassed ? (
                              <Badge className="bg-emerald-100 text-emerald-800 font-black border-none py-1 px-3">
                                PASSED
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-100 text-rose-800 font-black border-none py-1 px-3">
                                NEEDS IMPROVEMENT
                              </Badge>
                            )}
                          </td>
                          <td className="p-6 text-xs font-bold text-slate-500">
                            {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
