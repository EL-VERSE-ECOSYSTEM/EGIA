'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, MoreVertical, GraduationCap, ChevronRight } from 'lucide-react'
import { getAllStudents } from '@/app/actions/admin'
import Link from 'next/link'

export default function StudentListPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getAllStudents()
      setStudents(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Student Directory</h1>
            <p className="text-slate-500 font-medium text-lg">Manage all enrolled students across the academy.</p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black text-slate-600 gap-2 shadow-sm">
                <Filter size={18} /> FILTERS
             </Button>
             <Link href="/dashboard/admin/users/students/add">
                <Button className="h-14 px-8 rounded-2xl bg-amber-600 hover:bg-amber-700 font-black shadow-xl shadow-amber-200 gap-2">
                   <Plus size={20} /> ENROLL STUDENT
                </Button>
             </Link>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
             <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  placeholder="Search by name or admission number..."
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 font-bold text-slate-900 focus:ring-4 focus:ring-amber-600/10 transition-all"
                />
             </div>
             <Badge className="bg-slate-100 text-slate-900 h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest">{students.length} TOTAL</Badge>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Details</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Level</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admission No</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">Accessing academy database...</td></tr>
                    ) : students.length === 0 ? (
                      <tr><td colSpan={5} className="p-24 text-center text-slate-400 italic font-bold">No students found. Enroll someone to get started.</td></tr>
                    ) : students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="p-8">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg shadow-inner">
                                 {s.firstName[0]}{s.lastName[0]}
                              </div>
                              <div>
                                 <p className="text-lg font-black text-slate-900">{s.firstName} {s.lastName}</p>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.gender}</p>
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
