'use client'

import React, { useState } from 'react'
import { LiveAttendanceBoard } from '@/components/attendance/LiveAttendanceBoard'
import { AttendanceOverrideModal } from '@/components/attendance/AttendanceOverrideModal'
import { useLiveAttendance } from '@/hooks/useLiveAttendance'
import { useAuth } from '@/hooks/useAuth'
import { Download, Shield, Sparkles, RefreshCw } from 'lucide-react'
import type { TeacherAttendance } from '@/types/database.types'

export default function AdminAttendancePage() {
  const { user } = useAuth()
  const schoolId = user?.schoolId || (user as any)?.school_id || ''
  const adminLevel = (user as any)?.admin_level || (user as any)?.adminLevel || 'PRIMARY_ADMIN'
  const isPrimaryAdmin = user?.role === 'SUPER_ADMIN' || adminLevel === 'PRIMARY_ADMIN'

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const { records, loading, refetch } = useLiveAttendance(schoolId, selectedDate)

  const [overrideTarget, setOverrideTarget] = useState<TeacherAttendance | null>(null)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)

  const handleOverrideClick = (record: TeacherAttendance) => {
    setOverrideTarget(record)
    setIsOverrideModalOpen(true)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    window.open(`/api/admin/attendance/export?schoolId=${schoolId}&date=${selectedDate}&format=${format}`, '_blank')
  }

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Institutional Real-Time Monitoring
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Teacher Attendance & Clock-In Board
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
            Real-time monitoring of all school teachers' daily clock in/out status and manual override controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-blue-400" /> Print Report PDF
          </button>
        </div>
      </div>

      {/* Live Attendance Board */}
      <LiveAttendanceBoard
        records={records}
        loading={loading}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOverrideClick={handleOverrideClick}
        isPrimaryAdmin={isPrimaryAdmin}
      />

      {/* Override Modal */}
      <AttendanceOverrideModal
        record={overrideTarget}
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false)
          setOverrideTarget(null)
        }}
        onSuccess={refetch}
      />
    </div>
  )
}
