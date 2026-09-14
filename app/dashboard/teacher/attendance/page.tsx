'use client'

import React, { useState } from 'react'
import { ClockInOutWidget } from '@/components/attendance/ClockInOutWidget'
import { AttendanceHistoryTable } from '@/components/attendance/AttendanceHistoryTable'
import { LeaveBalanceCards } from '@/components/attendance/LeaveBalanceCards'
import { LeaveRequestModal } from '@/components/attendance/LeaveRequestModal'
import { useTeacherAttendance } from '@/hooks/useTeacherAttendance'
import { useTeacherAttendanceHistory } from '@/hooks/useTeacherAttendanceHistory'
import { useLeaveBalance } from '@/hooks/useLeaveBalance'
import { useLeaveTypes } from '@/hooks/useLeaveTypes'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, PlusCircle, CheckCircle, Clock, Award } from 'lucide-react'

export default function TeacherAttendancePage() {
  const { user } = useAuth()
  const teacherId = (user as any)?.teacher_id || (user as any)?.teacherId || user?.id || ''
  const schoolId = user?.schoolId || (user as any)?.school_id || ''

  const today = new Date().toISOString().slice(0, 10)
  const { record: todayRecord, loading: todayLoading, refetch: refetchToday } = useTeacherAttendance(teacherId, today)
  const { history, loading: historyLoading, refetch: refetchHistory } = useTeacherAttendanceHistory(teacherId, 30)
  const { balances, loading: balanceLoading, refetch: refetchBalances } = useLeaveBalance(teacherId)
  const { types: leaveTypes } = useLeaveTypes(schoolId)

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  const handleRefreshAll = () => {
    refetchToday()
    refetchHistory()
    refetchBalances()
  }

  // Summary counts from history
  const presentDays = history.filter(h => h.status === 'PRESENT').length
  const lateDays = history.filter(h => h.status === 'LATE').length
  const leaveDays = history.filter(h => h.status === 'ON_LEAVE').length

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Teacher Attendance & Clock-In Portal
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
            Clock in/out daily, track attendance metrics, and manage academic leave applications.
          </p>
        </div>

        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-900/30 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" /> Request Academic Leave
        </button>
      </div>

      {/* Clock In/Out Live Widget */}
      <ClockInOutWidget todayRecord={todayRecord} onRefresh={handleRefreshAll} />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Days Present (Last 30 Days)</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{presentDays} Days</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Late Arrivals</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{lateDays} Days</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Leaves Taken</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{leaveDays} Days</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Leave Balance Section */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-400" /> Leave Balances & Allocation
        </h2>
        <LeaveBalanceCards balances={balances} loading={balanceLoading} />
      </div>

      {/* Attendance History Table */}
      <AttendanceHistoryTable records={history} loading={historyLoading} />

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        leaveTypes={leaveTypes}
        schoolId={schoolId}
        teacherId={teacherId}
        onSuccess={handleRefreshAll}
      />
    </div>
  )
}
