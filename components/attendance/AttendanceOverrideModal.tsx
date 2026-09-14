'use client'

import React, { useState, useEffect } from 'react'
import { overrideAttendance } from '@/app/actions/attendance/overrideAttendance'
import { X, Shield, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TeacherAttendance } from '@/types/database.types'

interface AttendanceOverrideModalProps {
  record: TeacherAttendance | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AttendanceOverrideModal({
  record,
  isOpen,
  onClose,
  onSuccess
}: AttendanceOverrideModalProps) {
  const [newStatus, setNewStatus] = useState('PRESENT')
  const [clockIn, setClockIn] = useState('')
  const [clockOut, setClockOut] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (record) {
      setNewStatus(record.status || 'PRESENT')
      setClockIn(record.clock_in_at ? new Date(record.clock_in_at).toISOString().slice(0, 16) : '')
      setClockOut(record.clock_out_at ? new Date(record.clock_out_at).toISOString().slice(0, 16) : '')
      setReason(record.override_reason || '')
      setNotes(record.notes || '')
    }
  }, [record])

  if (!isOpen || !record) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for the override.')
      return
    }

    setLoading(true)

    try {
      const res = await overrideAttendance({
        attendanceId: record.id,
        teacherId: record.teacherid,
        workDate: record.work_date,
        schoolId: record.schoolid,
        newStatus,
        newClockIn: clockIn ? new Date(clockIn).toISOString() : undefined,
        newClockOut: clockOut ? new Date(clockOut).toISOString() : undefined,
        reason,
        notes,
      })

      if (res.success) {
        toast.success('Attendance record updated!')
        if (onSuccess) onSuccess()
        onClose()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Override failed')
    } finally {
      setLoading(false)
    }
  }

  const teacherName = record.teacher ? `${record.teacher.firstname} ${record.teacher.lastname}` : 'Teacher'

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in fade-in duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Primary Admin Override
          </div>
          <h2 className="text-xl font-black text-white">Manual Attendance Correction</h2>
          <p className="text-xs text-slate-400 font-bold">Modifying attendance for <strong className="text-white">{teacherName}</strong> on {record.work_date}</p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="block uppercase text-slate-400 mb-1">New Attendance Status *</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="HALF_DAY">HALF DAY</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-slate-400 mb-1">Clock In Time</label>
              <input
                type="datetime-local"
                value={clockIn}
                onChange={e => setClockIn(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block uppercase text-slate-400 mb-1">Clock Out Time</label>
              <input
                type="datetime-local"
                value={clockOut}
                onChange={e => setClockOut(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase text-slate-400 mb-1">Reason for Override *</label>
            <textarea
              rows={2}
              placeholder="State reason for manual correction (e.g. system error, medical emergency)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block uppercase text-slate-400 mb-1">Additional Notes (Optional)</label>
            <input
              type="text"
              placeholder="Optional notes or documentation details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

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
              className="flex-1 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
