'use client'

import React, { useState, useEffect } from 'react'
import { getTeacherWallet, getTeacherProfile } from '@/app/actions/teacher'
import { useSalaryDeductions } from '@/hooks/useSalaryDeductions'
import { SalaryDeductionTable } from '@/components/payroll/SalaryDeductionTable'
import { PayslipDownloadButton } from '@/components/payroll/PayslipDownloadButton'
import { useAuth } from '@/hooks/useAuth'
import { DollarSign, Wallet, Calendar, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'

export default function TeacherPayrollPage() {
  const { user } = useAuth()
  const teacherId = (user as any)?.teacher_id || (user as any)?.teacherId || user?.id || ''
  const schoolId = user?.schoolId || (user as any)?.school_id || ''

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [wallet, setWallet] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { deductions, loading: deductionsLoading, refetch } = useSalaryDeductions(schoolId, currentMonth, teacherId)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [w, p] = await Promise.all([
          getTeacherWallet().catch(() => null),
          getTeacherProfile().catch(() => null)
        ])
        setWallet(w)
        setProfile(p)
      } catch (err) {
        console.error('Error loading payroll data:', err)
        setError('Unable to load payroll details at this time.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const rawSalary = wallet?.salaryAmount ? parseFloat(wallet.salaryAmount) : null
  const grossSalary = rawSalary !== null && !isNaN(rawSalary) ? rawSalary : null

  const totalDeductions = deductions
    .filter(d => !d.reversed)
    .reduce((sum, d) => sum + Number(d.amount), 0)

  const netSalary = grossSalary !== null ? Math.max(0, grossSalary - totalDeductions) : null

  const teacherName = profile ? `${profile.firstName} ${profile.lastName}` : (user?.name || 'Academy Staff')
  const staffCode = profile?.staffCode || 'Staff'

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Teacher Payroll & Salary Statement
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
            Self-view monthly salary structure, applied deductions, and download official PDF payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={currentMonth}
            onChange={e => setCurrentMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
          />

          {grossSalary !== null && !loading && (
            <PayslipDownloadButton
              data={{
                schoolName: 'EL LEARNERS APP ACADEMY',
                teacherName,
                staffCode,
                month: currentMonth,
                grossSalary: grossSalary,
                deductions: deductions.filter(d => !d.reversed).map(d => ({
                  type: d.deduction_type,
                  amount: Number(d.amount),
                  reason: d.reason || undefined,
                })),
                netSalary: netSalary ?? 0,
              }}
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p>Loading payroll information...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-white">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gross Base Salary</p>
              <p className="text-3xl font-black text-white font-mono">
                {grossSalary !== null ? `NGN ${grossSalary.toLocaleString()}` : '—'}
              </p>
              <p className="text-[11px] text-slate-500 font-bold">
                {grossSalary !== null ? 'Base contractual monthly compensation' : 'Salary record not configured'}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-red-500/30 shadow-xl space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Deductions ({currentMonth})</p>
              <p className="text-3xl font-black text-red-400 font-mono">- NGN {totalDeductions.toLocaleString()}</p>
              <p className="text-[11px] text-red-400/80 font-bold">{deductions.filter(d => !d.reversed).length} deduction rule(s) applied</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/30 shadow-xl space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Payable Salary</p>
              <p className="text-3xl font-black text-teal-400 font-mono">
                {netSalary !== null ? `NGN ${netSalary.toLocaleString()}` : '—'}
              </p>
              <p className="text-[11px] text-teal-400/80 font-bold">Estimated payout after all deductions</p>
            </div>
          </div>

          {/* Salary Deductions Table */}
          <SalaryDeductionTable
            deductions={deductions}
            loading={deductionsLoading}
            isPrimaryAdmin={false}
            onRefresh={refetch}
          />
        </>
      )}
    </div>
  )
}
