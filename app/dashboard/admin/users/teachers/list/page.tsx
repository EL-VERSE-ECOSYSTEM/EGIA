'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, MoreVertical, Edit2, Trash2, Mail } from 'lucide-react'
import { getAllTeachers } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getAllTeachers()
      setTeachers(data)
      setIsLoading(false)
    }
    load()
  }, [])

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Academic Staff</h1>
            <p className="text-slate-500 font-medium text-lg">Manage teacher profiles, qualifications, and class assignments.</p>
          </div>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-amber-950 h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-amber-200">
             <Link href="/dashboard/admin/users/teachers/add"><Plus className="w-6 h-6 mr-2" /> Register Staff</Link>
          </Button>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input className="pl-12 h-12 rounded-2xl bg-slate-50 border-none font-medium" placeholder="Search staff by name or email..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl h-12 border-2 text-xs font-bold">Filter: All Departments</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Staff Name</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">ID / Email</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Qualification</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                         [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="p-10 bg-slate-50/50 border-b" /></tr>)
                      ) : teachers.map((t) => (
                         <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black">
                                     {t.firstName[0]}{t.lastName[0]}
                                  </div>
                                  <div>
                                     <p className="font-black text-slate-900">{t.firstName} {t.lastName}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase">{t.specialization || 'General'}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-6">
                               <p className="font-bold text-slate-700 text-sm">{t.user?.email}</p>
                               <p className="text-[10px] text-slate-400">STAFF-{t.id.substring(0,6).toUpperCase()}</p>
                            </td>
                            <td className="p-6 font-bold text-slate-600">{t.qualification || 'N/A'}</td>
                            <td className="p-6">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="text-xs font-black text-emerald-600 uppercase">Active</span>
                               </div>
                            </td>
                            <td className="p-6 text-right">
                               <div className="flex justify-end gap-2">
                                  <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                     <Mail className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                                     <Edit2 className="w-4 h-4" />
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
