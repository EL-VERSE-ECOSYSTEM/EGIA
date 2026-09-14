'use client'

import React, { useState } from 'react'
import { LeaveApprovalModal } from '@/components/attendance/LeaveApprovalModal'
import { useLeaveRequests } from '@/hooks/useLeaveRequests'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Clock, CheckCircle2, XCircle, FileText, ExternalLink, Shield } from 'lucide-react'
import type { TeacherLeaveRequest } from '@/types/database.types'

export default function AdminLeavePage() {
  const { user } = useAuth()
  const schoolId = user?.schoolId || (user as any)?.school_id || ''

  const [tabFilter, setTabFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const { requests, loading, refetch } = useLeaveRequests(schoolId, undefined, tabFilter)

  const [selectedRequest, setSelectedRequest] = useState<TeacherLeaveRequest | null>(null)

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

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Teacher Leave Management & Approvals
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
            Review submitted teacher leave applications, inspect attached medical certificates, and approve/reject requests.
          </p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-black text-white">Leave Requests Directory</h3>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTabFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition relative ${
                  tabFilter === tab ? 'bg-teal-600 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab}</span>
                {tab === 'PENDING' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
                <th className="py-4 px-6">Teacher</th>
                <th className="py-4 px-4">Leave Type</th>
                <th className="py-4 px-4">Dates / Work Days</th>
                <th className="py-4 px-4">Reason</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Loading leave requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No leave requests found for category "{tabFilter}".
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const teacherName = r.teacher ? `${r.teacher.firstname} ${r.teacher.lastname}` : 'Teacher'
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-bold text-white">
                        <div>
                          <p className="text-white font-bold">{teacherName}</p>
                          <p className="text-[10px] text-slate-400">{r.teacher?.staffcode || 'Staff'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
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
                      <td className="py-4 px-6 text-right space-x-2">
                        {r.attachment_url && (
                          <a
                            href={r.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline text-xs font-bold mr-3"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Doc
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition"
                        >
                          Review / Action
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <LeaveApprovalModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onSuccess={refetch}
      />
    </div>
  )
}
