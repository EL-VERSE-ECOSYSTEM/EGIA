'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getSuperAdminOverviewStats } from '@/app/actions/super-admin'
import { Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function RealTimeWalletsLedgerPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    setLoading(true)
    const res = await getSuperAdminOverviewStats()
    if (res.success) {
      setData(res)
    } else {
      toast.error('Failed to load transaction ledger')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtimeSubscription('transaction_ledger', () => {
    loadData()
    toast.info('Transaction ledger updated in real time')
  })

  useRealtimeSubscription('payment', () => {
    loadData()
  })

  const ledger = data?.ledger || []
  const filteredLedger = ledger.filter((item: any) =>
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.gateway?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="super-admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase mb-2">
              <Wallet className="w-3.5 h-3.5" /> Financial Intelligence
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Real-Time Platform Wallets & Transaction Ledger</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              Live financial tracking of money entering and leaving user wallets and school payment gateways in real time.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Total Platform Volume</span>
            <p className="text-2xl font-black text-slate-900 mt-1">NGN {Number(data?.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Active Registered Schools</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{data?.totalSchools || 0}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Active Wallet Users</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{data?.totalUsers || 0}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transaction ledger by description, reference, or gateway..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading live transaction ledger...</p>
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-900">No Transactions Found</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">No transaction records matching your search criteria.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Type</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Gateway / Ref</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredLedger.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                          tx.direction === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {tx.direction === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900">{tx.description}</td>
                      <td className="p-4 font-black text-slate-900">NGN {Number(tx.amount || 0).toLocaleString()}</td>
                      <td className="p-4 text-slate-500 font-mono text-[10px]">{tx.gateway || 'KORAPAY'} • {tx.reference}</td>
                      <td className="p-4 text-right text-slate-400 text-[10px]">{new Date(tx.createdAt || Date.now()).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
