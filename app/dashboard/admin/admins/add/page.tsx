'use client'

import React, { useState } from 'react'
import { createSchoolAdmin } from '@/app/actions/admin'
import { Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function AddAdminPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })

  const [level, setLevel] = useState<
    'VICE_PRINCIPAL_ACADEMICS' | 'VICE_PRINCIPAL_ADMIN' | 'HOD_SCIENCE' | 'HOD_ARTS' | 'HOD_COMMERCIAL' | ''
  >('')

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ name: string; email: string; level: string; emailSent: boolean } | null>(null)

  // Auto-fill department for HOD levels
  const department = level === 'HOD_SCIENCE' ? 'SCIENCE'
    : level === 'HOD_ARTS' ? 'ARTS'
    : level === 'HOD_COMMERCIAL' ? 'COMMERCIAL'
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setErrorMessage('Please complete the administrator name and email.')
      return
    }

    if (!level) {
      setErrorMessage('Please select an administrative role level.')
      return
    }

    setLoading(true)

    try {
      const result = await createSchoolAdmin({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        adminLevel: level,
      })
      setSuccessData({
        name: `${formData.firstName} ${formData.lastName}`,
        email: result.email,
        level: result.adminLevel,
        emailSent: !result.emailDeliveryFailed,
      })
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add administrator')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-4xl mx-auto text-white">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" /> School Admin Provisioning
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Add New School Administrator
        </h1>
        <p className="text-xs sm:text-sm font-bold text-slate-400">
          Assign Vice Principals and Head of Departments (HODs) with tenant-scoped administrative access.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successData ? (
        <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/30 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Administrator Added!</h2>
            <p className="text-slate-400 text-xs font-bold mt-1">
              <strong className="text-white">{successData.name}</strong> ({successData.email}) has been assigned as <strong className="text-teal-400">{successData.level}</strong>.
              {successData.emailSent
                ? ' A temporary password was sent by email and must be changed on first sign-in.'
                : ' The account was created, but its welcome email could not be delivered. Contact support before sign-in.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSuccessData(null)
              setFormData({ firstName: '', lastName: '', email: '' })
              setLevel('')
            }}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-wider transition"
          >
            Add Another Administrator
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 text-xs font-bold">
          {/* Section 1: Personal Credentials */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-teal-400 tracking-wider">1. Personal & Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ezeako"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@school.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Admin Level Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h2 className="text-xs font-black uppercase text-teal-400 tracking-wider">2. Role Level & Department</h2>
            <div>
              <label className="block text-slate-400 mb-1">Select Administrative Role Level *</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as typeof level)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-teal-500"
                required
              >
                <option value="">Select level...</option>
                <option value="VICE_PRINCIPAL_ACADEMICS">Vice Principal — Academics</option>
                <option value="VICE_PRINCIPAL_ADMIN">Vice Principal — Administration</option>
                <option value="HOD_SCIENCE">HOD — Science Department</option>
                <option value="HOD_ARTS">HOD — Arts & Humanities Department</option>
                <option value="HOD_COMMERCIAL">HOD — Commercial & Business Department</option>
              </select>
            </div>

            {level.startsWith('HOD_') && (
              <div>
                <label className="block text-slate-400 mb-1">Assigned Department (Auto-Filled)</label>
                <input
                  type="text"
                  value={department}
                  readOnly
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-teal-400 font-mono"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-teal-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register & Assign Administrator'}
          </button>
        </form>
      )}
    </div>
  )
}
