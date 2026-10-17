'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  getAllUsersForSuperAdmin,
  toggleUserSuspensionAction,
  deleteUserAccountAction
} from '@/app/actions/super-admin'
import { Users, RefreshCw, Search, ShieldAlert, Ban, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    const res = await getAllUsersForSuperAdmin()
    if (res.success) {
      setUsers(res.users || [])
    } else {
      toast.error('Failed to load user directory')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useRealtimeSubscription('user', () => {
    loadUsers()
    toast.info('User directory updated in real time')
  })

  const handleToggleSuspension = async (userId: string, isSuspended: boolean) => {
    const res = await toggleUserSuspensionAction(userId, !isSuspended)
    if (res.success) {
      toast.success(`User ${!isSuspended ? 'suspended' : 'unsuspended'} successfully`)
      loadUsers()
    } else {
      toast.error(res.error || 'Action failed')
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user account ${email}? This action cannot be undone.`)) return
    const res = await deleteUserAccountAction(userId)
    if (res.success) {
      toast.success('User account deleted')
      loadUsers()
    } else {
      toast.error(res.error || 'Deletion failed')
    }
  }

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-black uppercase mb-2">
              <Users className="w-3.5 h-3.5" /> User Directory
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management & Account Security Control</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              View all platform users across all schools, suspend/unsuspend accounts, and enforce access controls in real time.
            </p>
          </div>
          <button
            onClick={loadUsers}
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
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading user directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-black text-slate-900">No Users Found</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">No user accounts matching your search filter.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-black text-slate-900">{u.name || 'User'}</td>
                      <td className="p-4 text-slate-500">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                          u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleSuspension(u.id, !!u.isSuspended)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition ${
                            u.isSuspended ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                          }`}
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase transition"
                        >
                          Delete
                        </button>
                      </td>
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
