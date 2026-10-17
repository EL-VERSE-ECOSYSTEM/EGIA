'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  getPendingSchoolApplicationsAction,
  reviewSchoolApplicationAction,
  verifyApplicationDocumentAction,
  approveSchoolApplicationAction,
  rejectSchoolApplicationAction,
  activateSchoolAdminAction
} from '@/app/actions/super-admin'
import { Building2, CheckCircle, XCircle, RefreshCw, Clock, ExternalLink, ShieldCheck, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function ApplicationsQueuePage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadApplications = async () => {
    setLoading(true)
    const res = await getPendingSchoolApplicationsAction()
    if (res.success && 'applications' in res) {
      setApplications(res.applications || [])
    } else {
      toast.error('error' in res ? res.error : 'Failed to fetch pending applications')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useRealtimeSubscription('school_registration_application', () => {
    loadApplications()
    toast.info('Applications Queue updated in real-time')
  })

  const handleVerifyDoc = async (id: string, isVerified: boolean) => {
    const res = await verifyApplicationDocumentAction({
      applicationId: id,
      status: isVerified ? 'VERIFIED' : 'REJECTED'
    })
    if (res.success) {
      toast.success(isVerified ? 'Document Verified' : 'Document Rejected')
      loadApplications()
    } else {
      toast.error('error' in res ? res.error : 'Action failed')
    }
  }

  const handleApproveApp = async (id: string) => {
    const res = await approveSchoolApplicationAction({ applicationId: id })
    if (res.success) {
      toast.success('School Application Approved and Activated!')
      loadApplications()
    } else {
      toast.error('error' in res ? res.error : 'Approval failed')
    }
  }

  const handleRejectApp = async (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    const res = await rejectSchoolApplicationAction({ applicationId: id, rejectionReason: reason })
    if (res.success) {
      toast.success('Application Rejected')
      loadApplications()
    } else {
      toast.error('error' in res ? res.error : 'Rejection failed')
    }
  }

  const filtered = applications.filter(a =>
    a.schoolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.applicantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.applicantEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.schoolCode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="super-admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-black uppercase mb-2">
              <Building2 className="w-3.5 h-3.5" /> Institutional Queue
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">School Applications Verification Queue</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              Review proof of address documents, payment statuses, and activate new school administrator accounts in real time.
            </p>
          </div>
          <button
            onClick={loadApplications}
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
            placeholder="Search by school name, applicant email, or registration code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading school applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-900">No Pending Applications</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">All submitted school applications have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(app => (
              <div key={app.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{app.schoolName}</h3>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Code: {app.schoolCode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      app.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Payment: {app.paymentStatus}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      app.documentVerificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                      app.documentVerificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Doc: {app.documentVerificationStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">Applicant Name</span>
                    <span className="text-slate-900">{app.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">Contact Email</span>
                    <span className="text-slate-900">{app.applicantEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">Contact Phone</span>
                    <span className="text-slate-900">{app.applicantPhone}</span>
                  </div>
                </div>

                {app.proofOfAddressUrl && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Proof of Address Document</span>
                    <a
                      href={app.proofOfAddressUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 uppercase"
                    >
                      <span>View File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  {app.documentVerificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerifyDoc(app.id, true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-sm transition"
                    >
                      Verify Document
                    </button>
                  )}
                  {app.approvalStatus !== 'APPROVED' && (
                    <button
                      onClick={() => handleApproveApp(app.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase shadow-sm transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve & Activate School
                    </button>
                  )}
                  <button
                    onClick={() => handleRejectApp(app.id)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase shadow-sm transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Application
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
