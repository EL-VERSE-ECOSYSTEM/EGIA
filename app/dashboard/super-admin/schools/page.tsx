'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  getSuperAdminOverviewStats,
  toggleSchoolParentRegistrationAction,
  updateSchoolPaymentStatusAction,
  sendSystemWideNotificationAction
} from '@/app/actions/super-admin'
import { Building2, RefreshCw, Search, ShieldCheck, Bell, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function ActiveSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    setLoading(true)
    const res = await getSuperAdminOverviewStats()
    if (res.success) {
      setSchools(res.schools || [])
    } else {
      toast.error('Failed to load registered schools')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtimeSubscription('school', () => {
    loadData()
    toast.info('Schools directory updated in real time')
  })

  const handleToggleParents = async (schoolId: string, current: boolean) => {
    const res = await toggleSchoolParentRegistrationAction(schoolId, !current)
    if (res.success) {
      toast.success(`Parent registration ${!current ? 'enabled' : 'disabled'}`)
      loadData()
    } else {
      toast.error('error' in res ? res.error : 'Toggle failed')
    }
  }

  const handleTogglePayment = async (schoolId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID'
    const res = await updateSchoolPaymentStatusAction(schoolId, nextStatus)
    if (res.success) {
      toast.success(`School payment status updated to ${nextStatus}`)
      loadData()
    } else {
      toast.error('error' in res ? res.error : 'Update failed')
    }
  }

  const filtered = schools.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="super-admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-black uppercase mb-2">
              <Building2 className="w-3.5 h-3.5" /> Schools Directory
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Schools & Institutional Control</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              Monitor active school tenants, manage payment status, and toggle parent onboarding rules in real time.
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

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by school name, registration code, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading registered schools...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-900">No Schools Found</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">No active schools matching your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{s.name}</h3>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Code: {s.code}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    s.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {s.paymentStatus || 'PAID'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-600 space-y-1">
                  <p><strong>Location:</strong> {s.location || 'Not Specified'}</p>
                  <p><strong>Admin Contact:</strong> {s.adminName || 'Admin'} ({s.adminEmail || 'N/A'})</p>
                  <p><strong>Parent Registration Allowed:</strong> {s.allowParents ? 'Yes' : 'No'}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleParents(s.id, !!s.allowParents)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                  >
                    {s.allowParents ? 'Disable Parents' : 'Enable Parents'}
                  </button>
                  <button
                    onClick={() => handleTogglePayment(s.id, s.paymentStatus || 'PAID')}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                  >
                    Toggle Payment ({s.paymentStatus === 'PAID' ? 'Set Pending' : 'Set Paid'})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
