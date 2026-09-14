'use client'

import React, { useState, useEffect } from 'react'
import { clockIn } from '@/app/actions/attendance/clockIn'
import { clockOut } from '@/app/actions/attendance/clockOut'
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle, Calendar, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TeacherAttendance } from '@/types/database.types'

interface ClockInOutWidgetProps {
  todayRecord?: TeacherAttendance | null
  onRefresh?: () => void
}

export function ClockInOutWidget({ todayRecord, onRefresh }: ClockInOutWidgetProps) {
  const [time, setTime] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const updateTicker = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    updateTicker()
    const timer = setInterval(updateTicker, 1000)
    return () => clearInterval(timer)
  }, [])

  const isClockedIn = Boolean(todayRecord?.clock_in_at)
  const isClockedOut = Boolean(todayRecord?.clock_out_at)

  const handleClockIn = async () => {
    setLoading(true)
    try {
      const res = await clockIn(navigator.userAgent)
      if (res.success) {
        toast.success('Clocked in successfully!')
        if (onRefresh) onRefresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'Clock in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    setLoading(true)
    try {
      const res = await clockOut(navigator.userAgent)
      if (res.success) {
        toast.success('Clocked out successfully!')
        if (onRefresh) onRefresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'Clock out failed')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeStr = (iso?: string | null) => {
    if (!iso) return '--:--'
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
      {/* Dynamic Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Ticker & Status Header */}
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Real-Time Attendance Clock
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Clock className="w-8 h-8 text-teal-400 animate-pulse" />
            <span>{time || '00:00:00 AM'}</span>
          </div>
          <p className="text-slate-400 text-xs font-bold flex items-center justify-center md:justify-start gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateStr}</span>
          </p>
        </div>

        {/* Current Status Badge */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-xs font-mono">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Today's Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isClockedOut ? 'bg-blue-400' : isClockedIn ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="font-bold text-sm text-white uppercase">
                {isClockedOut ? 'Clocked Out' : isClockedIn ? `Clocked In (${todayRecord?.status})` : 'Not Clocked In'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold">
              In: <strong className="text-white">{formatTimeStr(todayRecord?.clock_in_at)}</strong> • Out: <strong className="text-white">{formatTimeStr(todayRecord?.clock_out_at)}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              <span>Clock In Now</span>
            </button>
          ) : !isClockedOut ? (
            <button
              onClick={handleClockOut}
              disabled={loading}
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              <span>Clock Out Now</span>
            </button>
          ) : (
            <div className="px-6 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs uppercase flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Day Completed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
