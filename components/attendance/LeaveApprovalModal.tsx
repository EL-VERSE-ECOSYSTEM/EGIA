'use client'

import React, { useState } from 'react'
import { approveLeave } from '@/app/actions/leave/approveLeave'
import { rejectLeave } from '@/app/actions/leave/rejectLeave'
import { X, CheckCircle2, XCircle, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { TeacherLeaveRequest } from '@/types/database.types'

interface LeaveApprovalModalProps {
  request: TeacherLeaveRequest | null
  onClose: () => void
  onSuccess?: () => void
}

export function LeaveApprovalModal({ request, onClose, onSuccess }: LeaveApprovalModalProps) {
  const [mode, setMode] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [comment, setComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMessage] = useState<string | null>(null)

  if (!request) return null

  const handleApprove = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await approveLeave(request.id, comment)
      if (res.success) {
        toast.success('Leave request approved!')
        if (onSuccess) onSuccess()
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Approval failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrorMessage('Rejection reason is required.')
      return
    }
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await rejectLeave(request.id, rejectionReason)
      if (res.success) {
        toast.success('Leave request rejected')
        if (onSuccess) onSuccess()
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Rejection failed')
    } finally {
      setLoading(false)
    }
  }

  const teacherName = request.teacher ? `${request.teacher.firstname} ${request.teacher.lastname}` : 'Teacher'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in fade-in duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-black text-white">Review Leave Request</h2>
          <p className="text-xs text-slate-400 font-bold mt-1">Submitted by <strong className="text-white">{teacherName}</strong> ({request.teacher?.staffcode || 'Staff'})</p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Request Details */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Leave Type:</span>
            <span className="text-teal-400 font-bold">{request.leave_type?.name || 'Leave'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Duration:</span>
            <span className="text-white font-bold">{request.start_date} to {request.end_date} ({request.total_days} Days)</span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-slate-300 font-sans">
            <p className="text-[10px] uppercase text-slate-400 font-bold font-mono">Reason:</p>
            <p className="mt-1">{request.reason}</p>
          </div>
          {request.attachment_url && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-sans">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Attachment:</span>
              <a
                href={request.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline text-xs font-bold flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> View Document <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Decision Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-black">
          <button
            type="button"
            onClick={() => setMode('APPROVE')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'APPROVE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Approve Leave
          </button>
          <button
            type="button"
            onClick={() => setMode('REJECT')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'REJECT' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-4 h-4" /> Reject Leave
          </button>
        </div>

        {mode === 'APPROVE' ? (
          <div className="space-y-3">
            <label className="block text-xs uppercase font-bold text-slate-400">Admin Comment (Optional)</label>
            <textarea
              rows={3}
              placeholder="Add optional notes or comments for approval..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleApprove}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Approval'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs uppercase font-bold text-slate-400">Reason for Rejection *</label>
            <textarea
              rows={3}
              placeholder="Explain why this leave application is being rejected..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-red-500"
              required
            />
            <button
              onClick={handleReject}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
