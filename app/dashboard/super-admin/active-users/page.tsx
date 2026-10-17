'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getAllUsersForSuperAdmin } from '@/app/actions/super-admin'
import { Users, RefreshCw, Search, Activity, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function SuperAdminActiveUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadActiveUsers = async () => {
    setLoading(true)
    const res = await getAllUsersForSuperAdmin()
    if (res.success) {
      setUsers((res.users || []).filter((u: any) => !u.isSuspended))
    } else {
      toast.error('Failed to load active users')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadActiveUsers()
  }, [])

  useRealtimeSubscription('user', () => {
    loadActiveUsers()
    toast.info('Active users list updated in real time')
  })

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="super-admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase mb-2">
              <Activity className="w-3.5 h-3.5" /> Real-Time Presence
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Platform Users Directory</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              Live monitoring of active non-suspended students, teachers, parents, and school administrators in real time.
            </p>
          </div>
          <button
            onClick={loadActiveUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search active users by name, email, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading active users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-900">No Active Users Found</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">No user accounts matching your active search query.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 font-semibold text-xs text-slate-700">
              {filtered.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      {u.name ? u.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{u.name || 'User'}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                      {u.role}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
