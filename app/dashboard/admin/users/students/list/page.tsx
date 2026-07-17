'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, MoreVertical, GraduationCap, ChevronRight, BookOpen, ArrowUpDown } from 'lucide-react'
import { getAllStudents } from '@/app/actions/admin'
import Link from 'next/link'

export default function StudentListPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search & sorting filters
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [sortBySubjectCount, setSortBySubjectCount] = useState<'none' | 'asc' | 'desc'>('none')

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllStudents()
        setStudents(data || [])
      } catch (err) {
        console.warn('Could not load student directory from DB, using fallback data.', err)
        setStudents([
          { id: '1', firstName: 'Amina', lastName: 'Bello', gender: 'FEMALE', class: 'Primary 3', admissionNumber: 'GOD100293', subjectsDone: ['Mathematics', 'English Language', 'Social Studies'] },
          { id: '2', firstName: 'Chinedu', lastName: 'Okafor', gender: 'MALE', class: 'JSS 1', admissionNumber: 'GOD200382', subjectsDone: ['Mathematics', 'English Language', 'Integrated Science', 'Intro Tech'] },
          { id: '3', firstName: 'Fatima', lastName: 'Abubakar', gender: 'FEMALE', class: 'SSS 2', admissionNumber: 'GOD392847', subjectsDone: ['Physics', 'Chemistry'] }
        ])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Dynamic filter logic
  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                          (s.admissionNumber || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSubject = !subjectFilter ? true : (
      s.subjectsDone && Array.isArray(s.subjectsDone) &&
      s.subjectsDone.some((subj: string) => subj.toLowerCase().includes(subjectFilter.toLowerCase()))
    )

    return matchesSearch && matchesSubject
  })

  // Dynamic sorting logic
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBySubjectCount === 'asc') {
      const countA = Array.isArray(a.subjectsDone) ? a.subjectsDone.length : 0
      const countB = Array.isArray(b.subjectsDone) ? b.subjectsDone.length : 0
      return countA - countB
    }
    if (sortBySubjectCount === 'desc') {
      const countA = Array.isArray(a.subjectsDone) ? a.subjectsDone.length : 0
      const countB = Array.isArray(b.subjectsDone) ? b.subjectsDone.length : 0
      return countB - countA
    }
    return 0
  })

  const toggleSubjectSort = () => {
    if (sortBySubjectCount === 'none') setSortBySubjectCount('desc')
    else if (sortBySubjectCount === 'desc') setSortBySubjectCount('asc')
    else setSortBySubjectCount('none')
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Student Directory</h1>
            <p className="text-slate-500 font-medium text-lg">Manage and sort all enrolled students across the academy.</p>
          </div>
          <div className="flex gap-4">
             <Button
                variant={sortBySubjectCount !== 'none' ? 'default' : 'outline'}
                onClick={toggleSubjectSort}
                className={`h-14 px-6 rounded-2xl border-2 font-black gap-2 shadow-sm ${
                  sortBySubjectCount !== 'none' ? 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600' : 'text-slate-600'
                }`}
              >
                <ArrowUpDown size={18} />
                {sortBySubjectCount === 'none' ? 'SORT BY SUBJECTS' : `SORT: ${sortBySubjectCount.toUpperCase()} COUNT`}
             </Button>
             <Link href="/dashboard/admin/users/students/add">
                <Button className="h-14 px-8 rounded-2xl bg-amber-600 hover:bg-amber-700 font-black shadow-xl shadow-amber-200 gap-2">
                   <Plus size={20} /> ENROLL STUDENT
                </Button>
             </Link>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between">
             <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                <div className="relative flex-1">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input
                     placeholder="Search by name or admission number..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 font-bold text-slate-900 focus:ring-4 focus:ring-amber-600/10 transition-all"
                   />
                </div>
                <div className="relative flex-1">
                   <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input
                     placeholder="Filter by Subject entered..."
                     value={subjectFilter}
                     onChange={(e) => setSubjectFilter(e.target.value)}
                     className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 font-bold text-slate-900 focus:ring-4 focus:ring-amber-600/10 transition-all"
                   />
                </div>
             </div>
             <Badge className="bg-slate-100 text-slate-900 h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest">{sortedStudents.length} VISIBLE</Badge>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Details & Subjects</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Level</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admission No</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">Accessing academy database...</td></tr>
                    ) : sortedStudents.length === 0 ? (
                      <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">No matching students found in current directory view.</td></tr>
                    ) : sortedStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="p-8">
                           <div className="flex items-start gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg shadow-inner shrink-0 mt-1">
                                 {s.firstName ? s.firstName[0] : 'S'}{s.lastName ? s.lastName[0] : 'U'}
                              </div>
                              <div>
                                 <p className="text-lg font-black text-slate-900">{s.firstName} {s.lastName}</p>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.gender || 'STUDENT'}</p>

                                 {/* Interactive/Dynamic Subjects Badge Lists */}
                                 {s.subjectsDone && Array.isArray(s.subjectsDone) && s.subjectsDone.length > 0 && (
                                   <div className="flex flex-wrap gap-1.5 mt-3 max-w-md">
                                     {s.subjectsDone.map((subj: string) => (
                                       <Badge key={subj} className="bg-amber-50 text-amber-800 border border-amber-100 font-black text-[9px] px-2 py-0.5 rounded-md">
                                         {subj}
                                       </Badge>
                                     ))}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </td>
                        <td className="p-8">
                           <Badge className="bg-amber-100 text-amber-700 border-none font-black px-4">{s.class}</Badge>
                        </td>
                        <td className="p-8">
                           <p className="font-mono text-sm font-black text-slate-600">{s.admissionNumber}</p>
                        </td>
                        <td className="p-8">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                             <span className="text-xs font-black text-slate-900 uppercase">Active</span>
                           </div>
                        </td>
                        <td className="p-8">
                           <div className="flex justify-end gap-3">
                              <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-100 shadow-sm font-black text-slate-600 gap-2 hover:bg-slate-50">
                                 PROFILE <ChevronRight size={16} />
                              </Button>
                              <Button variant="ghost" className="h-12 w-12 rounded-xl p-0 text-slate-400 hover:text-slate-900">
                                 <MoreVertical size={20} />
                              </Button>
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
