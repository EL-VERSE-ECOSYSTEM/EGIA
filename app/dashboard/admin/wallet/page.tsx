'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAdminWalletSummaryAction, awardStudentGiftAction } from '@/app/actions/payments'
import { getAllStudents } from '@/app/actions/admin'
import { createClient } from '@/lib/supabase/client'
import { Wallet, DollarSign, ArrowUpRight, TrendingUp, Gift, Trophy, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminWalletPage() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [walletSummary, setWalletSummary] = useState<{
    totalRevenue: number
    transactionCount: number
    categoryBreakdown: Record<string, number>
    recentTransactions: any[]
  } | null>(null)

  // Leaderboard Gift Award Modal
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [awarding, setAwarding] = useState(false)
  const [giftData, setGiftData] = useState({
    studentId: '',
    title: 'Top Leaderboard Award - Academic Excellence',
    reason: 'First place on school academic leaderboard for Term 3',
    amount: '5000'
  })

  const fetchWallet = async () => {
    try {
      const summary = await getAdminWalletSummaryAction()
      setWalletSummary(summary)
    } catch (err) {
      console.warn('Admin wallet summary error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsList = async () => {
    try {
      const list = await getAllStudents()
      setStudents(list || [])
    } catch (err) {
      console.warn('Students fetch error:', err)
    }
  }

  useEffect(() => {
    fetchWallet()
    fetchStudentsList()

    // Real-Time Supabase Database Subscription
    const supabase = createClient()
    const paymentChannel = supabase
      .channel('realtime-admin-wallet-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, () => {
        fetchWallet()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(paymentChannel)
    }
  }, [])

  const handleAwardGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!giftData.studentId || !giftData.amount || Number(giftData.amount) <= 0) {
      toast.error('Please select a student and enter a valid award amount.')
      return
    }

    setAwarding(true)
    try {
      const res = await awardStudentGiftAction(
        giftData.studentId,
        giftData.title,
        giftData.reason,
        Number(giftData.amount)
      )
      if (res.success) {
        toast.success(`Leaderboard gift of ₦${Number(giftData.amount).toLocaleString()} awarded in real time! Expiration set to 48 hours.`)
        setShowGiftModal(false)
        setGiftData({ ...giftData, studentId: '' })
      }
    } catch (err: any) {
      toast.error(err.message || 'Award gift failed')
    } finally {
      setAwarding(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        {/* ADMIN COLOR PALETTE: WARM AMBER & GOLD GRADIENT HEADER */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-yellow-200" /> Executive Revenue Vault
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">School Admin Wallet & Inflow</h1>
              <p className="text-amber-100 text-xs sm:text-sm font-bold max-w-xl">
                Real-time tracking of all incoming funds, tuition revenue, registration fees, and leaderboard learner award distribution.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/20">
                <Wallet className="w-8 h-8 text-yellow-300" />
                <div>
                  <p className="text-[10px] uppercase font-black text-amber-200">Total Money Coming In</p>
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    ₦{(walletSummary?.totalRevenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowGiftModal(true)}
                className="bg-white text-amber-800 hover:bg-amber-50 font-black text-xs uppercase tracking-wider h-14 rounded-2xl shadow-xl gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-600" /> Award Learner Gift
              </Button>
            </div>
          </div>
        </div>

        {/* AWARD GIFT MODAL */}
        {showGiftModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Award Top Learner Leaderboard Gift</h3>
                  <p className="text-xs text-slate-500 font-medium">Recipient gets cash or fee credit (expires 2 days after receipt)</p>
                </div>
              </div>

              <form onSubmit={handleAwardGift} className="space-y-4 text-xs font-bold">
                <div>
                  <Label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Select Student / Pupil *</Label>
                  <select
                    required
                    value={giftData.studentId}
                    onChange={(e) => setGiftData({ ...giftData, studentId: e.target.value })}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Student...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.class} • {s.admissionNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Award Title *</Label>
                  <Input
                    required
                    value={giftData.title}
                    onChange={(e) => setGiftData({ ...giftData, title: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <Label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Reason / Citation</Label>
                  <Input
                    value={giftData.reason}
                    onChange={(e) => setGiftData({ ...giftData, reason: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <Label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Reward Amount (₦) *</Label>
                  <Input
                    type="number"
                    required
                    value={giftData.amount}
                    onChange={(e) => setGiftData({ ...giftData, amount: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-black"
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                  ⚡ Automatic 48-Hour Disappearance Rule: The recipient will have 2 days to claim this reward as cash or apply it to school fees before it expires.
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowGiftModal(false)}
                    className="flex-1 h-11 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={awarding}
                    className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase"
                  >
                    {awarding ? 'Awarding Gift...' : 'Grant Leaderboard Gift'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CATEGORY BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-2">
            <div className="flex justify-between items-center text-amber-600">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Confirmed Transactions</span>
              <TrendingUp className="w-6 h-6 p-1 bg-amber-50 rounded-xl" />
            </div>
            <p className="text-2xl font-black text-slate-900">{walletSummary?.transactionCount || 0} Successful Payments</p>
            <p className="text-[11px] text-slate-500 font-medium">Reconciled in Supabase Database</p>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 md:col-span-2 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Revenue Breakdown by Fee Category</h3>
            <div className="flex flex-wrap gap-2">
              {walletSummary?.categoryBreakdown && Object.entries(walletSummary.categoryBreakdown).map(([cat, amt]) => (
                <div key={cat} className="px-3.5 py-2 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-slate-500">{cat}:</span>
                  <span className="font-black text-amber-700">₦{Number(amt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* INCOMING TRANSACTIONS FEED */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Live Incoming Transactions Feed</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time funds coming in from Korapay and Bank Transfers</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchWallet} className="text-xs font-bold text-amber-600 gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Real-Time
            </Button>
          </div>

          {!walletSummary?.recentTransactions || walletSummary.recentTransactions.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 italic text-center py-6">No incoming transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-black">
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Fee Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walletSummary.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="font-bold text-slate-800">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {tx.student ? `${tx.student.firstName} ${tx.student.lastName}` : 'Direct Inflow'}
                      </td>
                      <td className="py-3.5 px-4">{tx.feeType || 'Fee Payment'}</td>
                      <td className="py-3.5 px-4 font-black text-amber-700">₦{Number(tx.amount).toLocaleString()}</td>
                      <td className="py-3.5 px-4">{tx.paymentMethod}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{tx.transactionReference || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
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
