'use client'

import React, { useState } from 'react'
import { LeaveBalanceCards } from '@/components/attendance/LeaveBalanceCards'
import { LeaveRequestModal } from '@/components/attendance/LeaveRequestModal'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useLeaveBalance } from '@/hooks/useLeaveBalance'
import { useLeaveTypes } from '@/hooks/useLeaveTypes'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, PlusCircle, Clock, FileText, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

export default function TeacherLeavePage() {
  const { user } = useAuth()
  const teacherId = (user as any)?.teacher_id || (user as any)?.teacherId || user?.id || ''
  const schoolId = user?.schoolId || (user as any)?.school_id || ''

  const { balances, loading: balanceLoading, refetch: refetchBalances } = useLeaveBalance(teacherId)
  const { requests, loading: requestsLoading, refetch: refetchRequests } = useLeaveRequests(schoolId, teacherId)
  const { types: leaveTypes } = useLeaveTypes(schoolId)

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [tabFilter, setTabFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  const filteredRequests = requests.filter(r => tabFilter === 'ALL' || r.status === tabFilter)

  const handleRefresh = () => {
    refetchBalances()
    refetchRequests()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-black uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase">{status}</span>
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Academic Leave Applications & Balances
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
            Apply for leave, upload medical/supportive documents, and monitor approval status in real-time.
          </p>
        </div>

        <button
          onClick={() => setIsLeaveModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-900/30 transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4" /> Request Academic Leave
        </button>
      </div>

      {/* Leave Balances */}
      <LeaveBalanceCards balances={balances} loading={balanceLoading} />

      {/* Leave Request History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" /> Leave Application Records
            </h3>
            <p className="text-xs text-slate-400 font-medium">History of submitted leave requests and admin decisions</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTabFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  tabFilter === tab ? 'bg-teal-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-4">Dates / Days</th>
                <th className="py-4 px-4">Reason</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Admin Comment</th>
                <th className="py-4 px-6 text-right">Attachment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {requestsLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Loading leave requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white">
                      <p className="text-teal-400 font-bold">{r.leave_type?.name || 'Leave'}</p>
                      <p className="text-[10px] text-slate-400">{r.is_paid ? 'Paid' : 'Unpaid'}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-bold">
                      <p>{r.start_date} to {r.end_date}</p>
                      <p className="text-[10px] text-slate-400">{r.total_days} Work Days</p>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-sans max-w-xs truncate">
                      {r.reason}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-4 px-4 text-slate-400 font-sans">
                      {r.status === 'REJECTED' ? (
                        <span className="text-red-400">{r.rejection_reason || 'Rejected'}</span>
                      ) : (
                        <span>{r.admin_comment || '-'}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {r.attachment_url ? (
                        <a
                          href={r.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:underline text-xs font-bold"
                        >
                          <FileText className="w-3.5 h-3.5" /> View <ExternalLink className="w-3 h-3" />
                        </a>
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

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        leaveTypes={leaveTypes}
        schoolId={schoolId}
        teacherId={teacherId}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
