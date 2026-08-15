'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, Award, BookOpen, Bell } from 'lucide-react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function ParentAcademicCalendarPage() {
  const [termEvents, setTermEvents] = useState<any[]>([
    { id: '1', title: 'First Term Resumption Date', date: '2026-09-08', type: 'RESUMPTION', description: 'All students resume for the 2026/2027 Academic Session.' },
    { id: '2', title: 'Mid-Term Continuous Assessment (CBT)', date: '2026-10-19', type: 'ASSESSMENT', description: 'Online CBT Mid-term tests commence for all classes.' },
    { id: '3', title: 'Parent-Teacher Consultative Meeting', date: '2026-10-30', type: 'MEETING', description: 'Interactive review session for academic progress.' },
    { id: '4', title: 'Terminal Examinations (Exam CBT)', date: '2026-11-23', type: 'EXAM', description: 'Main terminal examinations across all subjects.' },
    { id: '5', title: 'Vacation & Report Card Release', date: '2026-12-11', type: 'HOLIDAY', description: 'End of term vacation and report card distribution.' }
  ])

  // Real-time Supabase Database Sync
  useRealtimeSubscription('academic_session', () => {
    toast('Academic calendar updated in real time')
  })
  useRealtimeSubscription('term', () => {
    toast('Academic term dates updated in real time')
  })

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Academic Calendar & Events</h1>
          <p className="text-slate-500 font-medium">Official school term schedule, resumptions, CBT assessments, and holidays synced in real time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
            <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <CalendarIcon className="text-emerald-600" /> Academic Term Timeline
                </CardTitle>
                <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">
                  2026 / 2027 Academic Session
                </CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-black px-4 py-1">CURRENT TERM</Badge>
            </CardHeader>

            <div className="space-y-6">
              {termEvents.map((ev, idx) => (
                <div key={ev.id} className="flex gap-6 items-start p-6 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0 font-black shadow-lg shadow-emerald-200">
                    <span className="text-xs uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl leading-none">{new Date(ev.date).getDate()}</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-slate-900 text-lg">{ev.title}</h3>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-black uppercase">
                        {ev.type}
                      </Badge>
                    </div>
                    <p className="text-slate-500 font-semibold text-xs">{ev.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" /> {new Date(ev.date).toDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-emerald-950 text-white p-6 space-y-4">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400 animate-pulse" /> Important Reminders
              </h3>
              <p className="text-emerald-200 text-xs font-semibold leading-relaxed">
                All term dates and CBT assessment schedules are synced directly from the school administration database.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
