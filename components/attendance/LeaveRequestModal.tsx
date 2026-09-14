'use client'

import React, { useState } from 'react'
import { requestLeave } from '@/app/actions/leave/requestLeave'
import { createClient } from '@/lib/supabase/client'
import { X, Calendar, Upload, FileText, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { LeaveType } from '@/types/database.types'

interface LeaveRequestModalProps {
  isOpen: boolean
  onClose: () => void
  leaveTypes: LeaveType[]
  schoolId: string
  teacherId: string
  onSuccess?: () => void
}

export function LeaveRequestModal({
  isOpen,
  onClose,
  leaveTypes,
  schoolId,
  teacherId,
  onSuccess
}: LeaveRequestModalProps) {
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const selectedType = leaveTypes.find(t => t.id === selectedTypeId)

  // Calculate total days excluding weekends
  let totalDays = 0
  if (startDate && endDate && endDate >= startDate) {
    const s = new Date(startDate)
    const e = new Date(endDate)
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) totalDays++
    }
    if (totalDays === 0) totalDays = 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedTypeId) {
      setErrorMessage('Please select a leave type.')
      return
    }
    if (!startDate || !endDate) {
      setErrorMessage('Please select valid start and end dates.')
      return
    }
    if (reason.trim().length < 20) {
      setErrorMessage('Please enter a detailed reason (at least 20 characters).')
      return
    }
    if (selectedType?.requires_attachment && !file) {
      setErrorMessage('An attachment (PDF/PNG/JPEG) is required for this leave type.')
      return
    }

    setLoading(true)

    try {
      let attachmentPath: string | undefined
      let attachmentUrl: string | undefined

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size exceeds 5MB limit')
        }

        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '')) {
          throw new Error('Only PDF, PNG, JPEG files are allowed')
        }

        const supabase = createClient()
        const path = `${schoolId}/${teacherId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

        const { data: storageData, error: uploadErr } = await supabase
          .storage
          .from('leave-attachments')
          .upload(path, file)

        if (uploadErr) {
          throw new Error(`Upload failed: ${uploadErr.message}`)
        }

        attachmentPath = storageData.path
        const { data: publicUrlData } = supabase
          .storage
          .from('leave-attachments')
          .getPublicUrl(path)

        attachmentUrl = publicUrlData.publicUrl
      }

      const res = await requestLeave({
        leaveTypeId: selectedTypeId,
        startDate,
        endDate,
        reason,
        attachmentPath,
        attachmentUrl,
      })

      if (res.success) {
        toast.success('Leave request submitted successfully!')
        if (onSuccess) onSuccess()
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit leave request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-teal-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in fade-in duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Request Academic Leave
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Submit Leave Application</h2>
          <p className="text-xs text-slate-400 font-bold">Specify leave parameters and attach supporting documents.</p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          {/* Leave Type */}
          <div>
            <label className="block uppercase text-slate-400 mb-1">Leave Type *</label>
            <select
              value={selectedTypeId}
              onChange={e => setSelectedTypeId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-teal-500 transition"
              required
            >
              <option value="">Select leave category...</option>
              {leaveTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.is_paid ? 'Paid' : 'Unpaid'}, Max {t.default_days_per_year} days/yr)
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-slate-400 mb-1">Start Date *</label>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block uppercase text-slate-400 mb-1">End Date *</label>
              <input
                type="date"
                min={startDate || new Date().toISOString().slice(0, 10)}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          {/* Total Days Display */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center font-mono">
            <span className="text-slate-400">Total Work Days Requesting:</span>
            <span className="text-teal-400 font-black text-sm">{totalDays} Day(s)</span>
          </div>

          {/* Reason */}
          <div>
            <label className="block uppercase text-slate-400 mb-1">Reason for Leave * (min 20 characters)</label>
            <textarea
              rows={3}
              placeholder="State the explicit reasons and details for your leave request..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block uppercase text-slate-400 mb-1">
              Supporting Attachment {selectedType?.requires_attachment ? '(Required *)' : '(Optional)'}
            </label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900 rounded-xl p-4 text-center">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-teal-400" />
                <p className="text-[11px] text-slate-300 font-bold">
                  {file ? file.name : 'Click or drop PDF / PNG / JPEG (max 5MB)'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-black text-xs uppercase tracking-wider transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
