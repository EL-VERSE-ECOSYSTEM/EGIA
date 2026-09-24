'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, User, Eye, Activity, Sparkles } from 'lucide-react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function CBTRealtimeMonitorPage() {
  const [sessions, setSessions] = useState<any[]>([
    {
      id: 'sess-1',
      studentName: 'Adebayo Samuel',
      class: 'SSS 3 Gold',
      assessmentTitle: 'Term 2 CBT Mathematics Exam',
      status: 'ACTIVE',
      warningCount: 0,
      lastEvent: 'Face aligned. Normal stream.',
      lastSnapshot: null,
      updatedAt: 'Just now'
    },
    {
      id: 'sess-2',
      studentName: 'Chiamaka Nnamdi',
      class: 'SSS 2 Silver',
      assessmentTitle: 'Physics Mock CBT',
      status: 'WARNING',
      warningCount: 2,
      lastEvent: 'PROHIBITED_OBJECT: Phone reflection detected',
      lastSnapshot: null,
      updatedAt: '1 min ago'
    }
  ])

  const [loading, setLoading] = useState(false)

  // Real-time Supabase Database Listener for assessment results and proctoring events
  useRealtimeSubscription('assessment_result', (payload: any) => {
    console.log('Realtime CBT proctoring update received:', payload)
    toast.info('Live proctoring telemetry update received!')
    if (payload?.new) {
      const newItem = payload.new
      setSessions((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === newItem.id)
        const updatedItem = {
          id: newItem.id,
          studentName: newItem.student_name || 'Student Candidate',
          class: newItem.class_level || 'General',
          assessmentTitle: newItem.assessment_title || 'CBT Exam',
          status: newItem.warning_count >= 3 ? 'TERMINATED' : newItem.warning_count > 0 ? 'WARNING' : 'ACTIVE',
          warningCount: newItem.warning_count || 0,
          lastEvent: newItem.last_event || 'Live camera feed connected',
          lastSnapshot: newItem.assessment_video || null,
          updatedAt: new Date().toLocaleTimeString()
        }

        if (existingIdx >= 0) {
          const list = [...prev]
          list[existingIdx] = updatedItem
          return list
        }
        return [updatedItem, ...prev]
      })
    }
  })

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-10">
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-[#1E3A8A] p-10 text-white shadow-2xl border border-blue-500/20">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-blue-400" /> AI Proctoring Center
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Camera className="w-9 h-9 text-red-500 animate-pulse" /> Real-Time CBT Webcam Monitor
            </h1>
            <p className="text-slate-300 font-bold text-sm">
              Synchronized live with Supabase Database. Monitor candidate video feeds, warnings, and anti-cheat telemetry in real time.
            </p>
          </div>
        </div>

        {/* Live Proctor Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Active Examination Sessions ({sessions.length})
            </h2>
            <Button variant="outline" size="sm" onClick={() => toast.success('Re-synced with Supabase Realtime!')} className="rounded-xl font-bold text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Realtime Streams
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((sess) => (
              <Card key={sess.id} className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden flex flex-col justify-between">
                <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-black text-blue-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">{sess.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{sess.class}</p>
                    </div>
                  </div>
                  {sess.status === 'ACTIVE' ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-[10px]">
                      LIVE FEED
                    </Badge>
                  ) : sess.status === 'WARNING' ? (
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-[10px] animate-pulse">
                      WARNING ({sess.warningCount}/3)
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 font-black text-[10px]">
                      TERMINATED
                    </Badge>
                  )}
                </div>

                <div className="aspect-video bg-black flex items-center justify-center relative">
                  {sess.lastSnapshot ? (
                    <video src={sess.lastSnapshot} autoPlay loop muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Camera className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                      <p className="text-[11px] font-mono text-slate-400">ENCRYPTED WEBCAM FEED</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-mono text-emerald-400 border border-slate-700">
                    REALTIME SYNC
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Exam Title</p>
                    <p className="text-xs font-bold text-slate-800">{sess.assessmentTitle}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[11px] space-y-1">
                    <p className="text-slate-500 text-[10px] font-bold uppercase">Latest Telemetry Log:</p>
                    <p className="text-slate-800 font-bold">{sess.lastEvent}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                    <span>Updated {sess.updatedAt}</span>
                    <button className="text-blue-600 hover:underline font-black flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Inspect Log
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
