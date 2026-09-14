'use client'

import React, { useState } from 'react'
import { reverseDeductionAction } from '@/app/actions/payroll/deductions'
import { DollarSign, RotateCcw, AlertCircle, Shield, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TeacherSalaryDeduction } from '@/types/database.types'

interface SalaryDeductionTableProps {
  deductions: TeacherSalaryDeduction[]
  loading?: boolean
  isPrimaryAdmin?: boolean
  onRefresh?: () => void
}

export function SalaryDeductionTable({
  deductions,
  loading,
  isPrimaryAdmin = false,
  onRefresh
}: SalaryDeductionTableProps) {
  const [reversingId, setReversingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const handleReverse = async (id: string) => {
    const promptReason = window.prompt('Enter reason for reversing this salary deduction:')
    if (!promptReason || !promptReason.trim()) return

    setReversingId(id)
    try {
      const res = await reverseDeductionAction(id, promptReason)
      if (res.success) {
        toast.success('Deduction reversed successfully!')
        if (onRefresh) onRefresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'Reversal failed')
    } finally {
      setReversingId(null)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-white">
      <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" /> Salary Deductions Breakdown
          </h3>
          <p className="text-xs text-slate-400 font-medium">Recorded penalties for absences, lates, and unpaid leave</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-black uppercase tracking-wider">
              <th className="py-4 px-6">Teacher</th>
              <th className="py-4 px-4">Deduction Type</th>
              <th className="py-4 px-4">Amount</th>
              <th className="py-4 px-4">Reason</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                  Loading deductions...
                </td>
              </tr>
            ) : deductions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                  No salary deductions recorded for this month.
                </td>
              </tr>
            ) : (
              deductions.map((d) => {
                const teacherName = d.teacher ? `${d.teacher.firstname} ${d.teacher.lastname}` : 'Teacher'
                return (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white">
                      <div>
                        <p className="text-white font-bold">{teacherName}</p>
                        <p className="text-[10px] text-slate-400">{d.teacher?.staffcode || 'Staff'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                        {d.deduction_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-red-400 font-bold text-sm">
                      - NGN {Number(d.amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-sans max-w-xs truncate">
                      {d.reason || d.deduction_type}
                    </td>
                    <td className="py-4 px-4">
                      {d.reversed ? (
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold line-through">
                          Reversed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
                          Applied
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isPrimaryAdmin && !d.reversed ? (
                        <button
                          onClick={() => handleReverse(d.id)}
                          disabled={reversingId === d.id}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 ml-auto disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Reverse
                        </button>
                      ) : (
                        <span className="text-slate-600">-</span>
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
  )
}
