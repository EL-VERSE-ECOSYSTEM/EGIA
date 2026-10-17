'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  getAllCBTsForSuperAdmin,
  approveCBTAssessmentAction
} from '@/app/actions/super-admin'
import { GraduationCap, RefreshCw, Search, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function SuperAdminCBTApprovalsPage() {
  const [cbts, setCbts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadCBTs = async () => {
    setLoading(true)
    const res = await getAllCBTsForSuperAdmin()
    if (res.success) {
      setCbts(res.cbts || [])
    } else {
      toast.error('Failed to load CBT assessments')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCBTs()
  }, [])

  useRealtimeSubscription('assessment', () => {
    loadCBTs()
    toast.info('CBT assessments updated in real time')
  })

  const handleApproveCBT = async (cbtId: string) => {
    const res = await approveCBTAssessmentAction(cbtId)
    if (res.success) {
      toast.success('CBT Assessment Approved!')
      loadCBTs()
    } else {
      toast.error('error' in res ? res.error : 'Approval failed')
    }
  }

  const filtered = cbts.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.targetClass?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="super-admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-black uppercase mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> Examination Oversight
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">CBT Exam Approvals & Platform Oversight</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              Review and approve Computer Based Tests created by teachers across all schools in real time.
            </p>
          </div>
          <button
            onClick={loadCBTs}
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
            placeholder="Search by CBT title, subject, or target class..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading CBT assessments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-900">No CBT Exams Found</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">No pending or active CBT exams matching your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(cbt => (
              <div key={cbt.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{cbt.title}</h3>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{cbt.subjectName || 'Subject'} • Class: {cbt.targetClass || 'All'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    cbt.status === 'APPROVED' || cbt.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {cbt.status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-600 space-y-1">
                  <p><strong>Duration:</strong> {cbt.durationMinutes || 45} minutes</p>
                  <p><strong>Pass Mark:</strong> {cbt.passMarkPercentage || 50}%</p>
                  <p><strong>Created At:</strong> {new Date(cbt.createdAt).toLocaleDateString()}</p>
                </div>

                {cbt.status !== 'APPROVED' && cbt.status !== 'approved' && (
                  <button
                    onClick={() => handleApproveCBT(cbt.id)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve CBT Assessment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
