'use client'

import { useEffect, useState } from 'react'
import {
  getSuperAdminOverviewStats,
  toggleSchoolParentRegistrationAction,
  updateSchoolPaymentStatusAction,
  sendSystemWideNotificationAction,
  getAllUsersForSuperAdmin,
  updateUserRoleAction,
  deleteUserAccountAction,
  getAllCBTsForSuperAdmin,
  approveCBTAssessmentAction
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
  CheckCircle,
  Trash2,
  Edit,
  ShieldAlert
} from 'lucide-react'

export default function SuperAdminOverviewPage() {
  const [activeTab, setActiveTab] = useState<'SCHOOLS' | 'USERS' | 'CBTS'>('SCHOOLS')
  const [data, setData] = useState<any>(null)
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

  const loadData = async () => {
    setLoading(true)
    const res = await getSuperAdminOverviewStats()
    if (res.success) {
      setData(res)
    }

    const usersRes = await getAllUsersForSuperAdmin()
    if (usersRes.success) {
      setUsersData(usersRes.users || [])
    }

    const cbtsRes = await getAllCBTsForSuperAdmin()
    if (cbtsRes.success) {
      setCbtsData(cbtsRes.cbts || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
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

  const handleApproveCBT = async (cbtId: string, approved: boolean) => {
    const comment = prompt('Optional comment for this CBT approval/rejection:')
    await approveCBTAssessmentAction(cbtId, approved, comment || undefined)
    loadData()
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
      alert(`Broadcast sent successfully to ${res.count} user accounts!`)
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
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
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
            Control, manage, verify, approve, manipulate, and broadcast to all registered schools and users in real time.
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
        <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('SCHOOLS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'SCHOOLS'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> School Management ({filteredSchools.length})
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'USERS'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'text-slate-400 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> User Management ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('CBTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'CBTS'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
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
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: any) => (
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
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                            title="Delete user account"
                          >
                            <Trash2 className="w-4 h-4" />
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
                            {c.status.toUpperCase()}
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
