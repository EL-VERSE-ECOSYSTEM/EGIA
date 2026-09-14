'use client'

import React, { useState } from 'react'
import { assignSchoolAdminRole } from '@/app/actions/admin-ops'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus, Shield, Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function AddAdminPage() {
  const { user } = useAuth()
  const schoolId = user?.schoolId || (user as any)?.school_id || ''

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    password: '',
  })

  const [level, setLevel] = useState<
    'VICE_PRINCIPAL_ACADEMICS' | 'VICE_PRINCIPAL_ADMIN' | 'HOD_SCIENCE' | 'HOD_ARTS' | 'HOD_COMMERCIAL' | ''
  >('')

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMessage] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any>(null)

  // Auto-fill department for HOD levels
  const department = level === 'HOD_SCIENCE' ? 'SCIENCE'
    : level === 'HOD_ARTS' ? 'ARTS'
    : level === 'HOD_COMMERCIAL' ? 'COMMERCIAL'
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      setErrorMessage('Please complete all personal credential fields.')
      return
    }

    if (!level) {
      setErrorMessage('Please select an administrative role level.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Upload CV if provided
      let cvUrl: string | undefined
      if (cvFile) {
        if (cvFile.size > 5 * 1024 * 1024) throw new Error('CV file size must be under 5MB')
        const path = `${schoolId}/cv_${Date.now()}_${cvFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const { data: storageData, error: cvErr } = await supabase.storage.from('school-cvs').upload(path, cvFile)
        if (cvErr) throw new Error(`CV upload failed: ${cvErr.message}`)
        cvUrl = storageData.path
      }

      // Provision user account in Supabase Database and Assign Role
      // 1. Check/Insert user row
      const newUserId = crypto.randomUUID()
      const { error: userErr } = await supabase.from('user').insert({
        id: newUserId,
        email: formData.email.trim().toLowerCase(),
        name: `${formData.firstName} ${formData.lastName}`,
        schoolid: schoolId,
        password: formData.password,
      })

      if (userErr && !userErr.message.includes('duplicate')) {
        throw new Error(`Failed to create user record: ${userErr.message}`)
      }

      // Fetch user ID if duplicate
      let finalUserId = newUserId
      if (userErr) {
        const { data: existingUser } = await supabase.from('user').select('id').eq('email', formData.email.trim().toLowerCase()).single()
        if (existingUser) finalUserId = existingUser.id
      }

      // 2. Set user_role = SCHOOL_ADMIN
      await supabase.from('user_role').upsert({
        id: crypto.randomUUID(),
        userid: finalUserId,
        role: 'SCHOOL_ADMIN',
      }, { onConflict: 'userid' })

      // 3. Assign school admin role level
      const roleRes = await assignSchoolAdminRole({
        schoolId,
        userId: finalUserId,
        level: level as any,
        department: department || undefined,
      })

      if (roleRes.success) {
        toast.success('Admin role assigned successfully!')
        setSuccessData({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          level,
          department,
        })
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add administrator')
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
            </p>
          </div>
          <button
            onClick={() => {
              setSuccessData(null)
              setFormData({ firstName: '', lastName: '', email: '', phone: '', gender: 'MALE', password: '' })
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
              <div>
                <label className="block text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 801 234 5678"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
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
                onChange={e => setLevel(e.target.value as any)}
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

          {/* Section 3: CV Upload */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-xs font-black uppercase text-teal-400 tracking-wider">3. Curriculum Vitae (CV / PDF)</h2>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl p-4 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={e => setCvFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-teal-400" />
                <p className="text-slate-300 font-bold">
                  {cvFile ? cvFile.name : 'Upload PDF CV / Resume (max 5MB)'}
                </p>
              </div>
            </div>
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
