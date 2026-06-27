'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowRight, Settings2, Plus } from 'lucide-react'

export default function AcademicSessionsPage() {
  const sessions = [
    { id: '1', name: '2023/2024 Academic Session', start: 'Sept 2023', end: 'July 2024', status: 'ACTIVE', terms: 3 },
    { id: '2', name: '2026/2027 Academic Session', start: 'Sept 2024', end: 'July 2025', status: 'UPCOMING', terms: 0 }
  ]

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Sessions & Terms</h1>
            <p className="text-slate-500 font-medium text-lg">Manage the school calendar and academic timeline.</p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950 h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-amber-200">
            <Plus className="w-6 h-6 mr-2" /> Start New Session
          </Button>
        </div>

        <div className="space-y-8">
           {sessions.map((s) => (
             <Card key={s.id} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] overflow-hidden bg-white">
                <CardContent className="p-0">
                   <div className="flex flex-col lg:flex-row">
                      <div className={`p-10 lg:w-1/3 flex flex-col justify-center ${s.status === 'ACTIVE' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-900'}`}>
                         <Badge className={`w-fit mb-4 border-none px-3 font-black text-[10px] uppercase ${s.status === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {s.status}
                         </Badge>
                         <h3 className="text-3xl font-black leading-tight mb-4">{s.name}</h3>
                         <div className="space-y-2 opacity-80 font-bold text-sm">
                            <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {s.start} - {s.end}</p>
                            <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {s.terms} Terms Configured</p>
                         </div>
                      </div>
                      <div className="p-10 flex-1 flex flex-col justify-center">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {[1,2,3].map(t => (
                               <div key={t} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Term {t}</p>
                                  <p className="font-black text-slate-900 mb-4">{t === 1 ? 'First' : t === 2 ? 'Second' : 'Third'} Term</p>
                                  <div className="flex items-center justify-between">
                                     <Badge variant="outline" className="text-[10px] border-emerald-100 bg-emerald-50 text-emerald-600 font-black px-2">Completed</Badge>
                                     <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Settings2 className="w-4 h-4" />
                                     </Button>
                                  </div>
                               </div>
                            ))}
                         </div>
                         <div className="flex justify-end gap-3">
                            <Button variant="outline" className="rounded-xl h-12 font-bold px-6 border-2">Session Settings</Button>
                            <Button className="rounded-xl h-12 font-black px-6 bg-slate-900 text-white">View Full Calendar <ArrowRight className="ml-2 w-4 h-4" /></Button>
                         </div>
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
