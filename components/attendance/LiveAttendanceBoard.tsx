'use client'

import React, { useState } from 'react'
import { Users, Search, Filter, Shield, Clock, CheckCircle2, AlertTriangle, XCircle, Calendar, RefreshCw } from 'lucide-react'
import type { TeacherAttendance } from '@/types/database.types'

interface LiveAttendanceBoardProps {
  records: TeacherAttendance[]
  loading?: boolean
  selectedDate: string
  onDateChange: (date: string) => void
  onOverrideClick?: (record: TeacherAttendance) => void
  isPrimaryAdmin?: boolean
}

export function LiveAttendanceBoard({
  records,
  loading,
  selectedDate,
  onDateChange,
  onOverrideClick,
  isPrimaryAdmin = false
}: LiveAttendanceBoardProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filtered = records.filter(r => {
    const teacherName = `${r.teacher?.firstname || ''} ${r.teacher?.lastname || ''} ${r.teacher?.staffcode || ''}`.toLowerCase()
    const matchesSearch = teacherName.includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const counts = {
    present: records.filter(r => r.status === 'PRESENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    leave: records.filter(r => r.status === 'ON_LEAVE').length,
  }

  const formatTime = (iso?: string | null) => {
    if (!iso) return '--:--'
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Live Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-white">
        <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Present Today</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{counts.present}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Late Arrivals</p>
            <p className="text-3xl font-black text-amber-400 mt-1">{counts.late}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-red-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Absent Teachers</p>
            <p className="text-3xl font-black text-red-400 mt-1">{counts.absent}</p>
          </div>
          <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-blue-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">On Approved Leave</p>
            <p className="text-3xl font-black text-blue-400 mt-1">{counts.leave}</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Date & Filters */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="w-5 h-5 text-teal-400 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-xs font-bold text-white focus:outline-none focus:border-teal-500 transition"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search teacher or staff code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="ABSENT">ABSENT</option>
            <option value="ON_LEAVE">ON LEAVE</option>
            <option value="HALF_DAY">HALF DAY</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                <th className="py-4 px-6">Teacher / Staff Code</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Clock In</th>
                <th className="py-4 px-4">Clock Out</th>
                <th className="py-4 px-4">Late / Notes</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Loading live attendance board...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No attendance records found for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const teacherName = r.teacher ? `${r.teacher.firstname} ${r.teacher.lastname}` : 'Unknown Teacher'
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-black text-xs">
                            {teacherName[0]}
                          </div>
                          <div>
                            <p className="text-white font-bold">{teacherName}</p>
                            <p className="text-[10px] text-slate-400">{r.teacher?.staffcode || 'No Staff Code'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          r.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          r.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          r.status === 'ABSENT' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          r.status === 'ON_LEAVE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-bold">{formatTime(r.clock_in_at)}</td>
                      <td className="py-4 px-4 text-slate-300 font-bold">{formatTime(r.clock_out_at)}</td>
                      <td className="py-4 px-4 text-slate-400">
                        {r.late_minutes && r.late_minutes > 0 ? (
                          <span className="text-amber-400 font-bold">+{r.late_minutes}m late</span>
                        ) : r.notes ? (
                          <span className="text-slate-300 font-sans">{r.notes}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isPrimaryAdmin ? (
                          <button
                            onClick={() => onOverrideClick && onOverrideClick(r)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 ml-auto"
                          >
                            <Shield className="w-3.5 h-3.5" /> Override
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px] uppercase font-sans">Read-Only</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
