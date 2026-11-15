'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calendar, CheckCircle2, CreditCard, Loader2, Wallet } from 'lucide-react'
import {
  createParentInstallmentPlan,
  getParentInstallmentOptions,
  getParentInstallments,
  initializeInstallmentPayment,
} from '@/app/actions/payments'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

type InstallmentOption = Awaited<ReturnType<typeof getParentInstallmentOptions>>[number]
type InstallmentRow = Awaited<ReturnType<typeof getParentInstallments>>[number]

export default function InstallmentsPage() {
  const [options, setOptions] = useState<InstallmentOption[]>([])
  const [installments, setInstallments] = useState<InstallmentRow[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedFeeType, setSelectedFeeType] = useState('')
  const [loading, setLoading] = useState(true)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const reload = useCallback(async () => {
    try {
      const nextOptions = await getParentInstallmentOptions()
      const nextInstallments = await getParentInstallments()
      setOptions(nextOptions)
      setInstallments(nextInstallments)
      setSelectedStudentId((current) => current || nextOptions[0]?.studentId || '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load payment plans.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])
  useRealtimeSubscription('payment_installment', () => { void reload() })
  useRealtimeSubscription('payment', () => { void reload() })

  const selectedOption = options.find((option) => option.studentId === selectedStudentId)
  const existingPlan = installments.some((item) =>
    item.studentId === selectedStudentId &&
    item.feeType === selectedFeeType &&
    item.termId === selectedOption?.termId
  )
  const pendingTotal = useMemo(() => installments
    .filter((item) => item.status !== 'paid')
    .reduce((sum, item) => sum + Math.max(0, Number(item.amount) - Number(item.paidAmount || 0)), 0), [installments])

  const createPlan = async () => {
    if (!selectedStudentId || !selectedFeeType) {
      setError('Choose a student and an active fee category first.')
      return
    }
    setCreatingPlan(true)
    setError('')
    setNotice('')
    try {
      const result = await createParentInstallmentPlan(selectedStudentId, selectedFeeType)
      setNotice(result.alreadyCreated
        ? 'Your 18-installment plan for this term is already active.'
        : 'Your 18-installment plan is ready. Each installment is saved to your school payment ledger.')
      await reload()
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : 'The installment plan could not be created.')
    } finally {
      setCreatingPlan(false)
    }
  }

  const payInstallment = async (item: InstallmentRow) => {
    setProcessingId(item.id)
    setError('')
    setNotice('')
    try {
      const result = await initializeInstallmentPayment(item.id)
      window.location.assign(result.checkoutUrl)
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Checkout could not be started.')
      setProcessingId(null)
      await reload()
    }
  }

  const isPlanPaid = (item: InstallmentRow) => item.status === 'paid'
  const isPlanProcessing = (item: InstallmentRow) => item.status === 'processing'

  return (
    <DashboardLayout role="parent">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
        <header className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 p-7 text-white shadow-xl md:flex-row md:items-center md:p-9">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-100">Parent payment center</p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Term Installments</h1>
            <p className="mt-2 max-w-2xl font-medium text-blue-100">
              Split an active school fee into 18 scheduled payments for the current term and pay securely with Paystack.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <Wallet className="h-8 w-8 text-blue-100" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Remaining installments</p>
              <p className="text-2xl font-black">₦{pendingTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </header>

        <Card className="overflow-hidden rounded-3xl border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100 p-6 md:p-8">
            <CardTitle className="text-xl font-black text-slate-900">Create a term plan</CardTitle>
            <p className="text-sm font-medium text-slate-500">The plan uses the school fee set for your linked student and term. Paystack adds its processing fee to each checkout.</p>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_1fr_auto] md:items-end md:p-8">
            <label className="space-y-2 text-sm font-bold text-slate-700">
              Student / pupil
              <select value={selectedStudentId} onChange={(event) => {
                setSelectedStudentId(event.target.value)
                setSelectedFeeType('')
                setError('')
                setNotice('')
              }} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3">
                <option value="">Select a linked student</option>
                {options.map((option) => (
                  <option key={option.studentId} value={option.studentId}>{option.studentName} · {option.className}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-bold text-slate-700">
              Active school fee
              <select value={selectedFeeType} onChange={(event) => {
                setSelectedFeeType(event.target.value)
                setError('')
                setNotice('')
              }} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3">
                <option value="">Select fee category</option>
                {selectedOption?.fees.map((fee) => (
                  <option key={fee.id} value={fee.feeType} disabled={fee.remainingAmount <= 0}>
                    {fee.feeType} · ₦{Number(fee.remainingAmount).toLocaleString('en-NG')} remaining
                  </option>
                ))}
              </select>
            </label>
            <Button
              onClick={createPlan}
              disabled={loading || creatingPlan || !selectedOption?.termId || !selectedFeeType || existingPlan}
              className="h-12 rounded-xl bg-blue-700 px-6 font-black text-white hover:bg-blue-800"
            >
              {creatingPlan ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : existingPlan ? 'PLAN ACTIVE' : 'CREATE 18-PAYMENT PLAN'}
            </Button>
            <div className="md:col-span-3">
              {selectedOption?.termName && (
                <p className="text-xs font-semibold text-slate-500">Current term: {selectedOption.termName}</p>
              )}
              {selectedOption && !selectedOption.termId && (
                <p className="text-sm font-semibold text-amber-700">Your school has not assigned an active term to this student yet.</p>
              )}
              {options.length === 0 && !loading && (
                <p className="text-sm font-semibold text-slate-500">No linked students with active fee schedules were found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {(error || notice) && (
          <div role={error ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {error ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
            <span>{error || notice}</span>
          </div>
        )}

        <Card className="overflow-hidden rounded-3xl border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6 md:p-8">
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Installment schedule</CardTitle>
              <p className="mt-1 text-sm font-medium text-slate-500">Successful payments are confirmed by Paystack and reflected here in real time.</p>
            </div>
            <Badge className="rounded-xl bg-blue-100 px-4 py-2 font-black text-blue-800">{installments.length} PAYMENTS</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-20 text-center text-slate-500"><Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />Loading your school payment plan…</div>
            ) : installments.length === 0 ? (
              <div className="p-14 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><CreditCard className="h-8 w-8" /></div>
                <h2 className="text-xl font-black text-slate-900">No installment plan yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">Choose a linked student and active fee above to create a plan with 18 payments spread across the term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="p-5">Installment</th>
                      <th className="p-5">Student / fee</th>
                      <th className="p-5">Amount</th>
                      <th className="p-5">Due date</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {installments.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-blue-50/40">
                        <td className="p-5 font-black text-slate-500">#{item.installmentNumber} / 18</td>
                        <td className="p-5">
                          <p className="font-bold text-slate-900">{item.studentName}</p>
                          <p className="text-xs font-semibold uppercase text-slate-500">{item.feeType} · {item.termId}</p>
                        </td>
                        <td className="p-5">
                          <p className="font-black text-slate-900">₦{Math.max(0, Number(item.amount) - Number(item.paidAmount || 0)).toLocaleString('en-NG', { minimumFractionDigits: 2 })} due</p>
                          {Number(item.paidAmount || 0) > 0 && <p className="text-[10px] font-semibold text-emerald-700">₦{Number(item.paidAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })} already applied</p>}
                          <p className="text-[10px] font-semibold text-slate-500">+ ₦{(selectedOption?.gatewayFee || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })} Paystack fee</p>
                        </td>
                        <td className="p-5 text-sm font-semibold text-slate-600"><span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" />{item.dueDate}</span></td>
                        <td className="p-5">
                          {isPlanPaid(item) ? (
                            <Badge className="gap-1 border-0 bg-emerald-100 font-black text-emerald-800"><CheckCircle2 className="h-3 w-3" /> PAID</Badge>
                          ) : isPlanProcessing(item) ? (
                            <Badge className="gap-1 border-0 bg-blue-100 font-black text-blue-800"><Loader2 className="h-3 w-3 animate-spin" /> PROCESSING</Badge>
                          ) : item.status === 'partial' ? (
                            <Badge className="border-0 bg-sky-100 font-black text-sky-800">PARTIALLY PAID</Badge>
                          ) : (
                            <Badge className="border-0 bg-amber-100 font-black text-amber-800">{item.status === 'overdue' ? 'OVERDUE' : 'PENDING'}</Badge>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          {!isPlanPaid(item) && (
                            <Button
                              onClick={() => payInstallment(item)}
                              disabled={processingId === item.id || isPlanProcessing(item)}
                              className="h-10 rounded-xl bg-blue-700 px-4 font-black text-white hover:bg-blue-800"
                            >
                              {processingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PAY WITH PAYSTACK'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
