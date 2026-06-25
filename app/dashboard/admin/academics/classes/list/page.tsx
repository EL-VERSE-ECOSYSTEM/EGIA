'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, BookOpen, MoreVertical, Search, Edit2 } from 'lucide-react'
import { getAllClasses } from '@/app/actions/admin'

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getAllClasses()
      setClasses(data)
      setIsLoading(false)
    }
    load()
  }, [])

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Class Management</h1>
            <p className="text-slate-500 font-medium text-lg">Manage school arms, departments, and class teachers.</p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950 h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-amber-200">
            <Plus className="w-6 h-6 mr-2" /> Create New Class
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {isLoading ? (
             [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2rem]" />)
           ) : classes.map((c) => (
             <Card key={c.id} className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
                <CardHeader className="bg-slate-50 p-8 border-b border-white relative">
                   <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm font-black text-xl">
                         {c.name.substring(0, 3)}
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 font-black text-[10px] uppercase">Active</Badge>
                   </div>
                   <div className="mt-6">
                      <h3 className="text-2xl font-black text-slate-900">{c.name} {c.arm}</h3>
                      <p className="text-slate-500 font-medium text-sm">{c.department || 'General'}</p>
                   </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Users className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Students</p>
                            <p className="text-sm font-bold text-slate-700">42 / {c.capacity}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <BookOpen className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Subjects</p>
                            <p className="text-sm font-bold text-slate-700">14</p>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Class Teacher</p>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200" />
                            <p className="text-sm font-bold text-slate-700">{c.teacher?.firstName || 'Not Assigned'}</p>
                         </div>
                         <Button size="icon" variant="ghost" className="rounded-xl text-slate-400">
                            <Edit2 className="w-4 h-4" />
                         </Button>
                      </div>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
