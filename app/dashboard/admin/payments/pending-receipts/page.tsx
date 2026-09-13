'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { approveReceipt, rejectReceipt } from '@/app/actions/payments'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, FileText, ExternalLink, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPendingReceiptsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const schoolId = 'school-elgoodnews-001'

  useEffect(() => {
    const supabase = createClient()
    async function loadReceipts() {
      const { data } = await supabase
        .from('payment_receipt_uploads')
        .select('*')
        .eq('schoolid', schoolId)
        .order('created_at', { ascending: false })
      setRows(data || [])
      setLoading(false)
    }
    loadReceipts()

    // Real-time Subscription
    const channel = supabase
      .channel('pending_receipts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_receipt_uploads', filter: `schoolid=eq.${schoolId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRows((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setRows((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)))
          } else if (payload.eventType === 'DELETE') {
            setRows((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [schoolId])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await approveReceipt(id)
      if (res.success) {
        toast.success('Receipt approved and official PDF receipt generated!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve receipt')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectId || !reason) return
    setProcessingId(rejectId)
    try {
      const res = await rejectReceipt(rejectId, reason)
      if (res.success) {
        toast.success('Receipt rejected with reason')
        setRejectId(null)
        setReason('')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject receipt')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pending Payment Receipts</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Review parent manual transfer receipts, approve to auto-generate PDF receipts, or reject with a reason.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading receipt requests...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-black text-slate-900">All clear!</h2>
            <p className="text-xs text-slate-500 font-medium">No pending receipt confirmations at this time.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Amount Claimed</th>
                    <th className="p-4">File Uploaded</th>
                    <th className="p-4">Uploaded At</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-900">{row.student_id || 'Student'}</td>
                      <td className="p-4 font-black text-emerald-600">NGN {parseFloat(row.amount_claimed || '0').toLocaleString()}</td>
                      <td className="p-4">
                        <a
                          href={row.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View File</span>
                        </a>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            row.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {row.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(row.id)}
                              disabled={processingId === row.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectId(row.id)}
                              disabled={processingId === row.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {row.status === 'APPROVED' && row.generated_receipt_url && (
                          <a
                            href={row.generated_receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold transition inline-flex items-center gap-1 text-[11px]"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-400" />
                            <span>Official PDF</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {rejectId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-slate-900">Reject Payment Receipt</h3>
              <p className="text-xs text-slate-500 font-medium">Provide a clear reason for the rejection so the parent can re-upload correctly.</p>
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Image unreadable / Amount on receipt does not match fee obligation."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setRejectId(null); setReason(''); }}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingId === rejectId}
                    className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold text-xs transition disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
