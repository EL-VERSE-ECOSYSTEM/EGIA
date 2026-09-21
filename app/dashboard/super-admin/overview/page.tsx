'use client'

import React, { useEffect, useState } from 'react'
import { subscribeToTable, unsubscribeFromTable } from '@/utils/supabase/client'
import {
  getSuperAdminOverviewStats,
  toggleSchoolParentRegistrationAction,
  updateSchoolPaymentStatusAction,
  sendSystemWideNotificationAction,
  getAllUsersForSuperAdmin,
  updateUserRoleAction,
  deleteUserAccountAction,
  getAllCBTsForSuperAdmin,
  approveCBTAssessmentAction,
  awardStudentGiftAction,
  toggleUserSuspensionAction,
  recordDisciplinaryAction,
  getPendingSchoolApplicationsAction,
  reviewSchoolApplicationAction,
  activateSchoolAdminAction,
  getSuperAdminSupportTicketsAction,
  replyToSupportTicketAction,
  quickReplySupportTicketAction,
  verifyApplicationDocumentAction,
  approveSchoolApplicationAction,
  rejectSchoolApplicationAction,
} from '@/app/actions/super-admin'
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  Sparkles,
  Search,
  BookOpen,
  Send,
  XCircle,
  RefreshCw,
  Gift,
  ShieldAlert,
  Ban,
  CheckCircle,
  Trash2,
  Award
} from 'lucide-react'
import { toast } from 'sonner'

export default function SuperAdminOverviewPage() {
  const [activeTab, setActiveTab] = useState<'APPLICATIONS' | 'SUPPORT' | 'SCHOOLS' | 'USERS' | 'CBTS' | 'GIFTS'>('APPLICATIONS')
  const [data, setData] = useState<any>(null)
  const [applicationsData, setApplicationsData] = useState<any[]>([])
  const [supportTicketsData, setSupportTicketsData] = useState<any[]>([])
  const [usersData, setUsersData] = useState<any[]>([])
  const [cbtsData, setCbtsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Broadcast Notification Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [selectedSchoolForNotif, setSelectedSchoolForNotif] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)

  // Student Gift Modal State
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [selectedStudentForGift, setSelectedStudentForGift] = useState<any | null>(null)
  const [giftTitle, setGiftTitle] = useState('Top Academic Award')
  const [giftReason, setGiftReason] = useState('Excellence in CBT assessment')
  const [giftAmount, setGiftAmount] = useState('5000')
  const [giftType, setGiftType] = useState<'CASH' | 'FEE_CREDIT' | 'CASH_OR_FEE'>('CASH_OR_FEE')
  const [submittingGift, setSubmittingGift] = useState(false)

  // Disciplinary Modal State
  const [showDiscModal, setShowDiscModal] = useState(false)
  const [selectedUserForDisc, setSelectedUserForDisc] = useState<any | null>(null)
  const [discTitle, setDiscTitle] = useState('Account Conduct Notice')
  const [discDescription, setDiscDescription] = useState('Breach of platform guidelines.')
  const [discType, setDiscType] = useState<'WARNING' | 'SUSPENSION' | 'PROBATION' | 'EXPULSION'>('WARNING')
  const [submittingDisc, setSubmittingDisc] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const res = await getSuperAdminOverviewStats()
    if (res.success) {
      setData(res)
    }

    const appsRes = await getPendingSchoolApplicationsAction()
    if (appsRes.success) {
      setApplicationsData(appsRes.applications || [])
    }

    const usersRes = await getAllUsersForSuperAdmin()
    if (usersRes.success) {
      setUsersData(usersRes.users || [])
    }

    const cbtsRes = await getAllCBTsForSuperAdmin()
    if (cbtsRes.success) {
      setCbtsData(cbtsRes.cbts || [])
    }

    const supportRes = await getSuperAdminSupportTicketsAction()
    if (supportRes.success) {
      setSupportTicketsData(supportRes.tickets || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()

    // Real-time Supabase Database Subscriptions across platform tables
    const appsChannel = subscribeToTable('school_registration_application', {
      callback: () => loadData(),
    })
    const schoolsChannel = subscribeToTable('school', {
      callback: () => loadData(),
    })
    const usersChannel = subscribeToTable('user', {
      callback: () => loadData(),
    })
    const cbtsChannel = subscribeToTable('assessment', {
      callback: () => loadData(),
    })
    const supportChannel = subscribeToTable('support_ticket', {
      callback: () => loadData(),
    })
    const repliesChannel = subscribeToTable('support_ticket_replies', {
      callback: () => loadData(),
    })

    return () => {
      unsubscribeFromTable(appsChannel)
      unsubscribeFromTable(schoolsChannel)
      unsubscribeFromTable(usersChannel)
      unsubscribeFromTable(cbtsChannel)
      unsubscribeFromTable(supportChannel)
      unsubscribeFromTable(repliesChannel)
    }
  }, [])

  const handleToggleParentAccess = async (schoolId: string, current: boolean) => {
    await toggleSchoolParentRegistrationAction(schoolId, !current)
    loadData()
  }

  const handleTogglePaymentStatus = async (schoolId: string, current: string) => {
    const newStatus = current === 'PAID' ? 'PENDING' : 'PAID'
    await updateSchoolPaymentStatusAction(schoolId, newStatus)
    loadData()
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await updateUserRoleAction(userId, newRole)
    loadData()
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return
    await deleteUserAccountAction(userId)
    loadData()
  }

  const handleToggleSuspension = async (userId: string, currentSuspended: boolean) => {
    const res = await toggleUserSuspensionAction(userId, !currentSuspended)
    if (res.success) {
      toast.success(currentSuspended ? 'User unsuspended successfully!' : 'User suspended successfully!')
      loadData()
    } else {
      toast.error('error' in res && res.error ? res.error : 'Failed to update user suspension state.')
    }
  }

  const handleAwardGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentForGift) return

    setSubmittingGift(true)
    const res = await awardStudentGiftAction({
      studentId: selectedStudentForGift.student?.id || selectedStudentForGift.id,
      title: giftTitle,
      reason: giftReason,
      amount: parseFloat(giftAmount) || 0,
      giftType,
      expirationHours: 48,
    })

    if (res.success) {
      toast.success('Gift awarded in real time! Award is now visible on student leaderboard.')
      setShowGiftModal(false)
      setSelectedStudentForGift(null)
    } else {
      toast.error('error' in res && res.error ? res.error : 'Failed to award gift.')
    }
    setSubmittingGift(false)
  }

  const handleDisciplinarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForDisc) return

    setSubmittingDisc(true)
    const res = await recordDisciplinaryAction({
      userId: selectedUserForDisc.id,
      title: discTitle,
      description: discDescription,
      actionType: discType,
    })

    if (res.success) {
      toast.success(`Disciplinary action (${discType}) executed in real time!`)
      setShowDiscModal(false)
      setSelectedUserForDisc(null)
      loadData()
    } else {
      toast.error('error' in res && res.error ? res.error : 'Failed to record disciplinary action.')
    }
    setSubmittingDisc(false)
  }

  const handleReviewApplication = async (applicationId: string, docStatus?: 'VERIFIED' | 'REJECTED', appStatus?: 'APPROVED' | 'REJECTED') => {
    const rejectionReason = appStatus === 'REJECTED' ? prompt('Reason for rejection:') || 'Documentation incomplete' : undefined
    const res = await reviewSchoolApplicationAction({
      applicationId,
      documentStatus: docStatus,
      approvalStatus: appStatus,
      rejectionReason,
    })
    if (res.success) {
      toast.success('Application state updated successfully.')
      loadData()
    } else {
      toast.error('error' in res && res.error ? res.error : 'Failed to update application review state.')
    }
  }

  const handleActivateSchoolAdmin = async (applicationId: string) => {
    if (!confirm('Activate school admin identity and send setup invitation link?')) return
    const res = await activateSchoolAdminAction(applicationId)
    if (res.success) {
      toast.success('School Admin activated and password setup/invitation issued!')
      loadData()
    } else {
      toast.error('error' in res && res.error ? res.error : 'Failed to activate School Admin.')
    }
  }

  const handleQuickReplySupport = async (ticketId: string) => {
    const res = await quickReplySupportTicketAction(ticketId)
    if (res.success) {
      toast.success("Quick reply sent in real time: \"We have taken note of the support submitted, we'll get back to you shortly\"")
      loadData()
    } else {
      toast.error('error' in res && res.error ? res.error : 'Failed to send quick reply.')
    }
  }

  const handleCustomReplySupport = async (ticketId: string) => {
    const customMessage = prompt('Type your custom support response for the user:')
    if (!customMessage?.trim()) return
    const res = await replyToSupportTicketAction(ticketId, customMessage.trim())
    if (res.success) {
      toast.success('Support reply sent successfully in real time!')
      loadData()
    } else {
      toast.error('error' in res && res.error ? res.error : 'Failed to send support reply.')
    }
  }

  const handleApproveCBT = async (cbtId: string, approved: boolean) => {
    const comment = prompt('Optional comment for this CBT approval/rejection:')
    await approveCBTAssessmentAction(cbtId, approved, comment || undefined)
    loadData()
  }

  const handleVerifyDoc = async (applicationId: string, status: 'VERIFIED' | 'REJECTED') => {
    let rejectionReason: string | undefined = undefined
    if (status === 'REJECTED') {
      rejectionReason = prompt('Rejection reason for proof of address document:') || 'Document rejected.'
    }
    const res = await verifyApplicationDocumentAction({ applicationId, status, rejectionReason })
    if (res.success) {
      toast.success(`Document verification status set to ${status}.`)
      loadData()
    } else {
      toast.error(res.error || 'Failed to update document status.')
    }
  }

  const handleApproveSchoolApp = async (applicationId: string) => {
    if (!confirm('Are you sure you want to approve this school registration application? This will create/activate the SCHOOL_ADMIN identity.')) return
    const res = await approveSchoolApplicationAction({ applicationId })
    if (res.success) {
      toast.success(`School application approved! SCHOOL_ADMIN identity created for ${res.adminEmail}.`)
      loadData()
    } else {
      toast.error(res.error || 'Failed to approve application.')
    }
  }

  const handleRejectSchoolApp = async (applicationId: string) => {
    const reason = prompt('Reason for rejecting this school application:')
    if (!reason) return
    const res = await rejectSchoolApplicationAction({ applicationId, rejectionReason: reason })
    if (res.success) {
      toast.success('School application rejected.')
      loadData()
    } else {
      toast.error(res.error || 'Failed to reject application.')
    }
  }

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastTitle || !broadcastMessage) return

    setSendingNotif(true)
    const res = await sendSystemWideNotificationAction({
      title: broadcastTitle,
      message: broadcastMessage,
      targetSchoolId: selectedSchoolForNotif || undefined
    })

    if (res.success) {
      alert(`Broadcast sent successfully to ${'count' in res ? res.count : 0} user accounts!`)
      setShowBroadcastModal(false)
      setBroadcastTitle('')
      setBroadcastMessage('')
    }
    setSendingNotif(false)
  }

  const filteredSchools = data?.schools?.filter((s: any) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const filteredUsers = usersData.filter((u: any) =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.school?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const studentUsers = usersData.filter((u: any) => Boolean(u.student))

  const filteredCBTs = cbtsData.filter((c: any) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.school?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="font-bold text-slate-300">Loading Super Admin Portal...</span>
        </div>
      </div>
    )
  }

  const stats = data?.stats || {}

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Tenant Platform Control
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Super Admin Dashboard <span className="text-emerald-400">EL LEARNERS APP</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Control, manage, verify, gift, suspend, and broadcast to all registered schools and users in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <Bell className="w-4 h-4" /> Send Broadcast Notification
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8 my-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Registered Schools</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white">{stats.totalSchools}</div>
            <p className="text-xs text-slate-400">{stats.paidSchoolsCount} Paid • {stats.pendingSchoolsCount} Pending</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Platform Subscription Revenue</span>
              <CreditCard className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">NGN {stats.totalSubscriptionRevenue?.toLocaleString()}</div>
            <p className="text-xs text-slate-400">Korapay School Subscriptions</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Platform Users Across Schools</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white">{stats.totalUsersCount}</div>
            <p className="text-xs text-slate-400">{stats.studentsCount} Students • {stats.teachersCount} Teachers • {stats.parentsCount} Parents</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Total CBT Assessments</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">{stats.cbtCount}</div>
            <p className="text-xs text-slate-400">Exam CBTs & Weekend Assignments</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('APPLICATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'APPLICATIONS'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Pending Applications Queue ({applicationsData.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'SUPPORT'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" /> Support Tickets ({supportTicketsData.length})
          </button>
          <button
            onClick={() => setActiveTab('SCHOOLS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'SCHOOLS'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> Active Schools ({filteredSchools.length})
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'USERS'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> User Management & Suspensions ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('GIFTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'GIFTS'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Gift className="w-4 h-4" /> Student Gifting ({studentUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('CBTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'CBTS'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" /> CBT Approvals ({filteredCBTs.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search across active tab records..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* APPLICATIONS QUEUE TAB */}
        {activeTab === 'APPLICATIONS' && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-400" /> Pending School Applications & Proof of Address Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Verify electricity bill / proof of address, confirm Korapay payment, and manually approve applications before activating SCHOOL_ADMIN identities.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">School & Address</th>
                    <th className="p-3">Applicant Contact (Unverified)</th>
                    <th className="p-3">Proof of Address (Electricity Bill)</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {applicationsData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                        No pending school applications in the queue.
                      </td>
                    </tr>
                  ) : (
                    applicationsData.map((app: any) => {
                      const canActivate = app.paymentStatus === 'SUCCESS' && app.approvalStatus === 'APPROVED' && app.documentVerificationStatus === 'VERIFIED'
                      return (
                        <tr key={app.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white">
                            <div>{app.schoolName}</div>
                            <div className="text-[10px] text-slate-400">{app.schoolAddress}</div>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-200">{app.applicantName}</p>
                            <p className="text-[10px] text-slate-400">{app.applicantEmail}</p>
                            <p className="text-[10px] text-slate-400">{app.applicantPhone}</p>
                          </td>
                          <td className="p-3">
                            {app.proofOfAddressFileUrl ? (
                              <div className="space-y-1">
                                <a
                                  href={app.proofOfAddressFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 hover:underline font-bold text-[11px] block"
                                >
                                  View Electricity Bill
                                </a>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  app.documentVerificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' :
                                  app.documentVerificationStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  Doc: {app.documentVerificationStatus}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No bill uploaded</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              app.paymentStatus === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {app.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              app.approvalStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                              app.approvalStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {app.approvalStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              onClick={() => handleReviewApplication(app.id, 'VERIFIED', 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-[10px] transition"
                            >
                              Verify & Approve
                            </button>
                            <button
                              onClick={() => handleReviewApplication(app.id, 'REJECTED', 'REJECTED')}
                              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-[10px] transition"
                            >
                              Reject
                            </button>
                            {canActivate && (
                              <button
                                onClick={() => handleActivateSchoolAdmin(app.id)}
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] shadow transition"
                              >
                                Activate Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SUPPORT TICKETS TAB */}
        {activeTab === 'SUPPORT' && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-400" /> Real-Time Support Tickets & One-Click Quick Reply Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Manage incoming support requests in real time. Send instant one-click acknowledgments or custom replies.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">Ticket ID & Title</th>
                    <th className="p-3">User & Contact</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Latest Response</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {supportTicketsData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                        No support tickets submitted yet.
                      </td>
                    </tr>
                  ) : (
                    supportTicketsData.map((t: any) => {
                      const latestReply = t.replies?.[0]
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white">
                            <div className="text-emerald-400 font-mono text-[11px]">{t.ticketNumber || t.id}</div>
                            <div className="text-slate-200">{t.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.description}</div>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-200">{t.userName}</p>
                            <p className="text-[10px] text-slate-400">{t.userEmail}</p>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                              {t.category || 'TECHNICAL'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                              t.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {t.status || 'OPEN'}
                            </span>
                          </td>
                          <td className="p-3 text-[10px]">
                            {latestReply ? (
                              <p className="text-slate-300 italic line-clamp-2">"{latestReply.message}"</p>
                            ) : (
                              <span className="text-slate-500 italic">No reply yet</span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              onClick={() => handleQuickReplySupport(t.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-[10px] transition"
                              title="Send preset acknowledgment: We have taken note of the support submitted, we'll get back to you shortly"
                            >
                              One-Click Quick Reply
                            </button>
                            <button
                              onClick={() => handleCustomReplySupport(t.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-[10px] transition"
                            >
                              Custom Reply
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SCHOOLS TAB */}
        {activeTab === 'SCHOOLS' && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">School Name</th>
                    <th className="p-3">Registration Code</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Admin Info</th>
                    <th className="p-3">Parent Reg.</th>
                    <th className="p-3">Subscription</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredSchools.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                        No registered schools found.
                      </td>
                    </tr>
                  ) : (
                    filteredSchools.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white">{s.name}</td>
                        <td className="p-3 font-mono font-black text-emerald-400">{s.code}</td>
                        <td className="p-3 text-slate-400">{s.location}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-200">{s.adminName}</p>
                          <p className="text-[10px] text-slate-400">{s.adminEmail}</p>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleParentAccess(s.id, s.allowParents)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              s.allowParents
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                          >
                            {s.allowParents ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleTogglePaymentStatus(s.id, s.paymentStatus)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              s.paymentStatus === 'PAID'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {s.paymentStatus}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedSchoolForNotif(s.id)
                              setShowBroadcastModal(true)
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] transition"
                          >
                            Notify School
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* USERS TAB */}
        {activeTab === 'USERS' && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">School Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: any) => {
                      const isSuspended = u.teacher?.isActive === false || u.student?.isActive === false
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white">{u.name || 'User'}</td>
                          <td className="p-3 text-slate-400">{u.email}</td>
                          <td className="p-3">
                            <select
                              value={u.userRole?.role || 'STUDENT'}
                              onChange={e => handleUpdateRole(u.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-400"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="TEACHER">TEACHER</option>
                              <option value="PARENT">PARENT</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          </td>
                          <td className="p-3 text-slate-400">{u.school?.name || 'Platform Wide'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuspended ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleToggleSuspension(u.id, isSuspended)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                                isSuspended ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30' : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
                              }`}
                            >
                              {isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForDisc(u)
                                setShowDiscModal(true)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 font-bold text-[10px] transition"
                            >
                              Discipline
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition inline-block align-middle"
                              title="Delete user account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* STUDENT GIFTS TAB */}
        {activeTab === 'GIFTS' && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                <Gift className="w-5 h-5" /> Award Reward Gifts to Students/Pupils
              </h3>
              <p className="text-xs text-slate-400 font-medium">Gifts expire after 48 hours and are visible on the Student Leaderboard.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Admission Number</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">School Name</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {studentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                        No registered students found.
                      </td>
                    </tr>
                  ) : (
                    studentUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white">{u.name || `${u.student?.firstName} ${u.student?.lastName}`}</td>
                        <td className="p-3 font-mono font-bold text-amber-400">{u.student?.admissionNumber || 'N/A'}</td>
                        <td className="p-3 text-slate-400">{u.student?.class || 'Primary'}</td>
                        <td className="p-3 text-slate-400">{u.school?.name || 'Platform Wide'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentForGift(u)
                              setShowGiftModal(true)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 ml-auto"
                          >
                            <Gift className="w-3.5 h-3.5" /> Award Gift
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* CBTS TAB */}
        {activeTab === 'CBTS' && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">Assessment Title</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">School Name</th>
                    <th className="p-3">Access Code</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredCBTs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                        No CBT assessments found.
                      </td>
                    </tr>
                  ) : (
                    filteredCBTs.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white">{c.title}</td>
                        <td className="p-3 text-slate-400 font-bold">{c.type}</td>
                        <td className="p-3 text-slate-400">{c.subject?.name || 'General'}</td>
                        <td className="p-3 text-slate-400">{c.school?.name || 'Platform Wide'}</td>
                        <td className="p-3 font-mono font-bold text-amber-400">{c.accessCode || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            c.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {c.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleApproveCBT(c.id, true)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-[10px] transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveCBT(c.id, false)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-[10px] transition"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* STUDENT GIFT MODAL */}
      {showGiftModal && selectedStudentForGift && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                <Gift className="w-5 h-5" /> Award Reward Gift to Learner
              </h3>
              <button onClick={() => setShowGiftModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAwardGiftSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Student / Pupil Name</label>
                <input
                  type="text"
                  disabled
                  value={selectedStudentForGift.name || `${selectedStudentForGift.student?.firstName} ${selectedStudentForGift.student?.lastName}`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Gift / Award Title *</label>
                <input
                  type="text"
                  required
                  value={giftTitle}
                  onChange={e => setGiftTitle(e.target.value)}
                  placeholder="e.g. Star Learner Excellence Award"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Gift Amount (NGN) *</label>
                <input
                  type="number"
                  required
                  value={giftAmount}
                  onChange={e => setGiftAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Gift Redemption Type</label>
                <select
                  value={giftType}
                  onChange={e => setGiftType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-bold"
                >
                  <option value="CASH_OR_FEE">Cash Payout or School Fee Credit</option>
                  <option value="CASH">Cash Payout Only</option>
                  <option value="FEE_CREDIT">School Fee Credit Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason / Citation</label>
                <textarea
                  rows={2}
                  value={giftReason}
                  onChange={e => setGiftReason(e.target.value)}
                  placeholder="Citation explaining this reward..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGift}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                >
                  {submittingGift ? 'Awarding...' : 'Award Gift Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCIPLINARY MODAL */}
      {showDiscModal && selectedUserForDisc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Record Disciplinary Action
              </h3>
              <button onClick={() => setShowDiscModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisciplinarySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Account</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedUserForDisc.name} (${selectedUserForDisc.email})`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Action Type *</label>
                <select
                  value={discType}
                  onChange={e => setDiscType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-rose-400 font-black"
                >
                  <option value="WARNING">FORMAL WARNING</option>
                  <option value="SUSPENSION">TEMPORARY SUSPENSION</option>
                  <option value="PROBATION">PROBATION</option>
                  <option value="EXPULSION">PERMANENT EXPULSION / DISMISSAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Title / Violation *</label>
                <input
                  type="text"
                  required
                  value={discTitle}
                  onChange={e => setDiscTitle(e.target.value)}
                  placeholder="e.g. Conduct Infraction / Examination Malpractice"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={discDescription}
                  onChange={e => setDiscDescription(e.target.value)}
                  placeholder="Detailed breakdown of the action..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDisc}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs"
                >
                  {submittingDisc ? 'Recording...' : 'Execute Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM-WIDE BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" /> Real-Time System Broadcast
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Target School</label>
                <select
                  value={selectedSchoolForNotif}
                  onChange={e => setSelectedSchoolForNotif(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="">All Schools (Platform Wide)</option>
                  {data?.schools?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notification Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Maintenance / Term Update"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notification Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type message to broadcast to users..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                >
                  {sendingNotif ? 'Sending Broadcast...' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
