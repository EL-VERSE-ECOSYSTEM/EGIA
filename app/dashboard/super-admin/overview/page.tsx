'use client'

import { useEffect, useState } from 'react'
import {
  getSuperAdminOverviewStats,
  toggleSchoolParentRegistrationAction,
  updateSchoolPaymentStatusAction,
  sendSystemWideNotificationAction
} from '@/app/actions/super-admin'
import {
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Bell,
  Sparkles,
  Search,
  BookOpen,
  Send,
  Lock,
  RefreshCw
} from 'lucide-react'

export default function SuperAdminOverviewPage() {
  const [data, setData] = useState<any>(null)
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
            Super Admin Dashboard <span className="text-emerald-400">EL LEARN APP</span>
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

        {/* Registered Schools Management Table */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" /> School Management & Real-Time Scoping
              </h2>
              <p className="text-xs text-slate-400">View school registration codes, manage parent registration permissions, and verify payment statuses.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search school name or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

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
