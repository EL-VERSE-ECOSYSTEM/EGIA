'use client'

import React, { useState } from 'react'
import { computeMonthlyDeductionsAction, updateTeacherPayConfigAction } from '@/app/actions/payroll/deductions'
import { SalaryDeductionTable } from '@/components/payroll/SalaryDeductionTable'
import { useSalaryDeductions } from '@/hooks/useSalaryDeductions'
import { useAuth } from '@/hooks/useAuth'
import { DollarSign, Shield, RefreshCw, Loader2, Sparkles, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPayrollDeductionsPage() {
  const { user } = useAuth()
  const schoolId = user?.schoolId || (user as any)?.school_id || ''
  const adminLevel = (user as any)?.admin_level || (user as any)?.adminLevel || 'PRIMARY_ADMIN'
  const isPrimaryAdmin = user?.role === 'SUPER_ADMIN' || adminLevel === 'PRIMARY_ADMIN'

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [computing, setComputing] = useState(false)

  const { deductions, loading, refetch } = useSalaryDeductions(schoolId, currentMonth)

  const handleComputeMonthly = async () => {
    if (!isPrimaryAdmin) {
      toast.error('Only Primary Admin can run monthly deduction calculations.')
      return
    }

    setComputing(true)
    try {
      const res = await computeMonthlyDeductionsAction(schoolId, currentMonth)
      if (res.success) {
        toast.success(`Deductions computed for month ${currentMonth}!`)
        refetch()
      }
    } catch (err: any) {
      toast.error(err.message || 'Deduction computation failed')
    } finally {
      setComputing(false)
    }
  }

  const totalDeductionsAmount = deductions
    .filter(d => !d.reversed)
    .reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" /> Primary Admin Payroll Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Monthly Salary Deductions & Penalties
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
            Automated and manual deduction review for teacher unauthorized absences, late arrivals, and unpaid leave.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={currentMonth}
            onChange={e => setCurrentMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
          />

          {isPrimaryAdmin && (
            <button
              onClick={handleComputeMonthly}
              disabled={computing}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Compute {currentMonth} Deductions</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Applied Deductions ({currentMonth})</p>
          <p className="text-3xl font-black text-red-400 font-mono mt-1">- NGN {totalDeductionsAmount.toLocaleString()}</p>
        </div>
        <div className="text-right font-mono text-xs text-slate-400">
          <p>Active Deductions: <strong className="text-white">{deductions.filter(d => !d.reversed).length}</strong></p>
          <p>Reversed Deductions: <strong className="text-amber-400">{deductions.filter(d => d.reversed).length}</strong></p>
        </div>
      </div>

      {/* Deductions Table */}
      <SalaryDeductionTable
        deductions={deductions}
        loading={loading}
        isPrimaryAdmin={isPrimaryAdmin}
        onRefresh={refetch}
      />
    </div>
  )
}
