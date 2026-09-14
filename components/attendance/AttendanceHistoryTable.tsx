'use client'

import React from 'react'
import { Calendar, Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Shield } from 'lucide-react'
import type { TeacherAttendance } from '@/types/database.types'

interface AttendanceHistoryTableProps {
  records: TeacherAttendance[]
  loading?: boolean
}

export function AttendanceHistoryTable({ records, loading }: AttendanceHistoryTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase">Present</span>
      case 'LATE':
        return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black text-[10px] uppercase">Late</span>
      case 'ABSENT':
        return <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-black text-[10px] uppercase">Absent</span>
      case 'ON_LEAVE':
        return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black text-[10px] uppercase">On Leave</span>
      case 'HALF_DAY':
        return <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-black text-[10px] uppercase">Half Day</span>
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-black text-[10px] uppercase">{status}</span>
    }
  }

  const formatTime = (iso?: string | null) => {
    if (!iso) return '--:--'
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatHours = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return '0 hrs'
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-white">
      <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" /> Attendance Log & History
          </h3>
          <p className="text-xs text-slate-400 font-medium">Recent daily clock in/out records</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Date</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Clock In</th>
              <th className="py-3.5 px-4">Clock Out</th>
              <th className="py-3.5 px-4">Total Worked</th>
              <th className="py-3.5 px-4">Late / Early</th>
              <th className="py-3.5 px-4 text-right">Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                  Loading attendance records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                  No attendance history available yet.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-4 sm:px-6 font-bold text-white">
                    {new Date(r.work_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-4">{getStatusBadge(r.status)}</td>
                  <td className="py-4 px-4 text-slate-300 font-bold">{formatTime(r.clock_in_at)}</td>
                  <td className="py-4 px-4 text-slate-300 font-bold">{formatTime(r.clock_out_at)}</td>
                  <td className="py-4 px-4 text-slate-300 font-bold">{formatHours(r.total_minutes)}</td>
                  <td className="py-4 px-4 text-slate-400">
                    {r.late_minutes && r.late_minutes > 0 ? (
                      <span className="text-amber-400 font-bold">+{r.late_minutes}m late</span>
                    ) : r.early_exit_minutes && r.early_exit_minutes > 0 ? (
                      <span className="text-purple-400 font-bold">-{r.early_exit_minutes}m early</span>
                    ) : (
                      <span className="text-slate-500">On Time</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {r.is_manual_override ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold" title={r.override_reason || 'Manual Correction'}>
                        <Shield className="w-3 h-3" /> Corrected
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
