'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getStudentWalletStatsAction, claimStudentGiftAction } from '@/app/actions/payments'
import { createClient } from '@/lib/supabase/client'
import { Wallet, Gift, Trophy, ArrowUpRight, Clock, CheckCircle2, Sparkles, AlertCircle, RefreshCw, DollarSign, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentWalletPage() {
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [walletStats, setWalletStats] = useState<{
    student: any
    activeGifts: any[]
    allGifts: any[]
    redeemedCashTotal: number
    appliedFeeCreditTotal: number
  } | null>(null)

  const fetchWallet = async () => {
    try {
      const res = await getStudentWalletStatsAction()
      setWalletStats(res)
    } catch (err: any) {
      console.warn('Wallet load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallet()

    // Real-Time Supabase Database Subscription for gifts & wallet updates
    const supabase = createClient()
    const channel = supabase
      .channel('realtime-student-gifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_gifts' }, () => {
        fetchWallet()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleClaim = async (giftId: string, actionType: 'CASH' | 'FEE_CREDIT') => {
    setClaimingId(giftId)
    try {
      const res = await claimStudentGiftAction(giftId, actionType)
      if (res.success) {
        toast.success(
          actionType === 'CASH'
            ? `₦${Number(res.amount).toLocaleString()} redeemed as cash gift!`
            : `₦${Number(res.amount).toLocaleString()} credited toward school fees!`
        )
        fetchWallet()
      }
    } catch (err: any) {
      toast.error(err.message || 'Claim failed')
    } finally {
      setClaimingId(null)
    }
  }

  // Calculate remaining hours before 2-day expiration
  const getRemainingTime = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr).getTime()
    const now = new Date().getTime()
    const diffMs = expiresAt - now
    if (diffMs <= 0) return 'Expired'
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m left`
  }

  return (
    <DashboardLayout role="student">
      <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
        {/* STUDENT COLOR PALETTE: ORANGE & AMBER GRADIENT HEADER */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Trophy className="w-3.5 h-3.5 text-amber-200" /> Learner Leaderboard Wallet
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Student / Pupil Rewards Portal</h1>
              <p className="text-orange-100 text-xs sm:text-sm font-bold max-w-xl">
                Earn monetary gifts and awards when picked as best learner according to the leaderboard! Claim cash or apply towards school fees.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
              <Wallet className="w-8 h-8 text-amber-300" />
              <div>
                <p className="text-[10px] uppercase font-black text-orange-200">Available Active Gifts</p>
                <p className="text-2xl font-black text-white">{walletStats?.activeGifts?.length || 0} Reward(s)</p>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-2">
            <div className="flex justify-between items-center text-orange-600">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Cash Claimed</span>
              <DollarSign className="w-6 h-6 p-1 bg-orange-50 rounded-xl" />
            </div>
            <p className="text-2xl font-black text-slate-900">₦{(walletStats?.redeemedCashTotal || 0).toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">Direct cash payouts received</p>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-2">
            <div className="flex justify-between items-center text-amber-600">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Fees Discount Applied</span>
              <ShieldCheck className="w-6 h-6 p-1 bg-amber-50 rounded-xl" />
            </div>
            <p className="text-2xl font-black text-slate-900">₦{(walletStats?.appliedFeeCreditTotal || 0).toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-medium">Applied towards tuition & school fees</p>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-2">
            <div className="flex justify-between items-center text-orange-600">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Gift Expiration Rule</span>
              <Clock className="w-6 h-6 p-1 bg-orange-50 rounded-xl" />
            </div>
            <p className="text-2xl font-black text-orange-600">48 Hours</p>
            <p className="text-[11px] text-slate-500 font-medium">Gifts disappear 2 days after receipt</p>
          </Card>
        </div>

        {/* ACTIVE LEADERBOARD REWARDS & GIFTS */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Active Leaderboard Awards & Gifts</h2>
                <p className="text-xs text-slate-500 font-medium">Claim before expiration (disappears 2 days after receiving)</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={fetchWallet} className="text-xs font-bold text-orange-600 gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Live
            </Button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs">Loading learner wallet...</div>
          ) : !walletStats?.activeGifts || walletStats.activeGifts.length === 0 ? (
            <div className="p-12 text-center bg-orange-50/50 rounded-3xl border border-orange-100/60 space-y-3">
              <Trophy className="w-12 h-12 text-orange-400 mx-auto" />
              <p className="text-sm font-black text-slate-900">No Pending Gifts Currently Available</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                Excel in your CBT assessments, class attendance, and study planner to climb the school leaderboard and receive cash/fee awards!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {walletStats.activeGifts.map((gift) => (
                <div
                  key={gift.id}
                  className="p-6 rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/40 to-amber-50/40 space-y-4 shadow-sm relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100">
                        Leaderboard Reward
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{gift.title}</h3>
                      <p className="text-xs text-slate-600 font-medium">{gift.reason}</p>
                    </div>
                    <span className="text-xl font-black text-orange-600 shrink-0">₦{Number(gift.amount).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-orange-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <Clock className="w-4 h-4" /> {getRemainingTime(gift.expiresAt)}
                    </span>
                    <span className="text-[10px] text-slate-400">Expires in 2 days</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleClaim(gift.id, 'CASH')}
                      disabled={claimingId === gift.id}
                      className="flex-1 h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider"
                    >
                      Receive as Cash
                    </Button>
                    <Button
                      onClick={() => handleClaim(gift.id, 'FEE_CREDIT')}
                      disabled={claimingId === gift.id}
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-orange-500 text-orange-700 hover:bg-orange-50 font-black text-xs uppercase tracking-wider"
                    >
                      Add to Pay School Fees
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ALL HISTORICAL REWARDS */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white p-8 sm:p-10 space-y-6">
          <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">Reward History Log</h2>
          {!walletStats?.allGifts || walletStats.allGifts.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 italic text-center py-6">No historical reward records.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-black">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walletStats.allGifts.map((g) => (
                    <tr key={g.id} className="font-bold text-slate-800">
                      <td className="py-3.5 px-4 font-black text-slate-900">{g.title}</td>
                      <td className="py-3.5 px-4 font-black text-orange-600">₦{Number(g.amount).toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          className={
                            g.status === 'REDEEMED_CASH'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : g.status === 'APPLIED_TO_FEES'
                              ? 'bg-blue-500/10 text-blue-700'
                              : g.status === 'AVAILABLE'
                              ? 'bg-amber-500/10 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                          }
                        >
                          {g.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{new Date(g.receivedAt).toLocaleDateString()}</td>
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
