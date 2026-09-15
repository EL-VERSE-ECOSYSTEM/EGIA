'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getParentWalletSummaryAction } from '@/app/actions/payments'
import { createClient } from '@/lib/supabase/client'
import { Wallet, ShieldCheck, Users, ArrowUpRight, CheckCircle2, Sparkles, RefreshCw, CreditCard, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ParentWalletPage() {
  const [loading, setLoading] = useState(true)
  const [parentSummary, setParentSummary] = useState<{
    parent: any
    children: any[]
    totalFeesPaid: number
    paymentsCount: number
    recentPayments: any[]
  } | null>(null)

  const fetchSummary = async () => {
    try {
      const res = await getParentWalletSummaryAction()
      setParentSummary(res)
    } catch (err: any) {
      console.warn('Parent wallet fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()

    // Real-Time Supabase Database Subscription
    const supabase = createClient()
    const channel = supabase
      .channel('realtime-parent-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, () => {
        fetchSummary()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <DashboardLayout role="parent">
      <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
        {/* PARENT COLOR PALETTE: EMERALD & TEAL GRADIENT HEADER */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-2xl shadow-emerald-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" /> Parent Guardian Financial Portal
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Parent Fees & Financial Summary</h1>
              <p className="text-emerald-100 text-xs sm:text-sm font-bold max-w-xl">
                Track total school fees paid, view linked ward clearance statuses, and make online or bank transfer payments in real time.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/20">
              <Wallet className="w-8 h-8 text-emerald-300" />
              <div>
                <p className="text-[10px] uppercase font-black text-emerald-200">Total School Fees Paid</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  ₦{(parentSummary?.totalFeesPaid || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-2">
            <div className="flex justify-between items-center text-emerald-600">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Linked Wards</span>
              <Users className="w-6 h-6 p-1 bg-emerald-50 rounded-xl" />
            </div>
            <p className="text-2xl font-black text-slate-900">{parentSummary?.children?.length || 0} Children</p>
            <p className="text-[11px] text-slate-500 font-medium">Registered under parent account</p>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-2">
            <div className="flex justify-between items-center text-emerald-600">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Payments Made</span>
              <Receipt className="w-6 h-6 p-1 bg-emerald-50 rounded-xl" />
            </div>
            <p className="text-2xl font-black text-slate-900">{parentSummary?.paymentsCount || 0} Receipts</p>
            <p className="text-[11px] text-slate-500 font-medium">Confirmed & reconciled transactions</p>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-2">
            <div className="flex justify-between items-center text-emerald-600">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Real-Time Verification</span>
              <CheckCircle2 className="w-6 h-6 p-1 bg-emerald-50 rounded-xl" />
            </div>
            <p className="text-2xl font-black text-emerald-600">Korapay & Bank</p>
            <p className="text-[11px] text-slate-500 font-medium">Automated & manual clearance</p>
          </Card>
        </div>

        {/* LINKED WARDS CLEARANCE */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Linked Children & Fee Status</h2>
            <Link href="/dashboard/parent/payments">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 rounded-xl">
                <CreditCard className="w-4 h-4" /> Make Fee Payment
              </Button>
            </Link>
          </div>

          {!parentSummary?.children || parentSummary.children.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 italic text-center py-6">No children currently linked to this parent account.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parentSummary.children.map((child) => (
                <div key={child.id} className="p-6 rounded-3xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-base text-slate-900">{child.firstName} {child.lastName}</h3>
                      <p className="text-xs font-bold text-emerald-600">{child.class} • {child.admissionNumber}</p>
                    </div>
                    <Badge className={child.registrationStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}>
                      {child.registrationStatus || 'ACTIVE'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Learner Clearance:</span>
                    <span className="text-emerald-700 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* PAYMENT HISTORY */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Real-Time Fee Payment Receipts</h2>
            <Button size="sm" variant="ghost" onClick={fetchSummary} className="text-xs font-bold text-emerald-600 gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Real-Time
            </Button>
          </div>

          {!parentSummary?.recentPayments || parentSummary.recentPayments.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 italic text-center py-6">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-black">
                    <th className="py-3 px-4">Fee Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Gateway / Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parentSummary.recentPayments.map((p) => (
                    <tr key={p.id} className="font-bold text-slate-800">
                      <td className="py-3.5 px-4 font-black text-slate-900">{p.feeType || 'School Fee'}</td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">₦{Number(p.amount).toLocaleString()}</td>
                      <td className="py-3.5 px-4">{p.paymentMethod}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.transactionReference || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        <Badge className="bg-emerald-500/10 text-emerald-700 uppercase">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
