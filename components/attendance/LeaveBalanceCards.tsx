'use client'

import React from 'react'
import { Calendar, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { TeacherLeaveBalance } from '@/types/database.types'

interface LeaveBalanceCardsProps {
  balances: TeacherLeaveBalance[]
  loading?: boolean
}

export function LeaveBalanceCards({ balances, loading }: LeaveBalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse h-28" />
        ))}
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs font-bold">
        No leave balance allocation records found for this academic year.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
      {balances.map(b => {
        const typeName = b.leave_type?.name || 'Leave'
        const allocated = b.allocated_days || 0
        const used = b.used_days || 0
        const pending = b.pending_days || 0
        const remaining = Math.max(0, allocated - used - pending)

        return (
          <div key={b.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">{typeName}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                b.leave_type?.is_paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {b.leave_type?.is_paid ? 'Paid' : 'Unpaid'}
              </span>
            </div>

            <div>
              <p className="text-2xl font-black font-mono text-teal-400">{remaining} Days</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Remaining Balance</p>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[10px] font-mono text-center">
              <div>
                <p className="text-slate-400 font-bold">Allocated</p>
                <p className="text-white font-black">{allocated}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Used</p>
                <p className="text-white font-black">{used}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Pending</p>
                <p className="text-amber-400 font-black">{pending}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
