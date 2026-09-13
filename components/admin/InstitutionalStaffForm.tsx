'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Loader2, AlertCircle } from 'lucide-react'
import { registerInstitutionalStaffAction } from '@/app/actions/admin-ops'
import { CvUploadField } from '@/components/uploads/CvUploadField'
import { toast } from 'sonner'

interface InstitutionalStaffFormProps {
  schoolId: string
  schoolCode: string
  onSuccess?: () => void
}

export function InstitutionalStaffForm({ schoolId, schoolCode, onSuccess }: InstitutionalStaffFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    role: 'ACCOUNTANT',
    department: 'Bursary',
    password: '',
  })

  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rolesList = [
    'ACCOUNTANT',
    'LIBRARIAN',
    'SECURITY',
    'CLEANER',
    'BURSAR',
    'ADMIN_ASSISTANT',
    'LAB_ATTENDANT',
    'DRIVER',
    'NURSE',
    'OTHER'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.firstName || !formData.lastName || !formData.role) {
      toast.error('Please fill in required staff details.')
      return
    }

    setLoading(true)

    try {
      const res = await registerInstitutionalStaffAction({
        schoolId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        role: formData.role,
        department: formData.department,
        cvUrl: cvUrl || undefined,
        password: formData.password || 'StaffPass123!'
      })

      if (res.success) {
        toast.success(`Staff enrolled successfully! Staff Code: ${res.staffCode}`)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: 'Male',
          role: 'ACCOUNTANT',
          department: 'Bursary',
          password: '',
        })
        setCvUrl(null)
        if (onSuccess) onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enroll institutional staff.')
      toast.error(err.message || 'Failed to enroll institutional staff.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container space-y-6">
      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 bg-slate-900 text-white">
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" /> Institutional Staff Enrollment
          </CardTitle>
          <CardDescription className="text-slate-400 font-bold text-xs mt-1">
            Enroll non-teaching institutional staff (Bursar, Accountant, Librarian, Security, etc.) with CV document upload.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">First Name *</Label>
                <Input
                  value={formData.firstName ?? ''}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. John"
                  required
                  className="h-12 rounded-xl border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Last Name *</Label>
                <Input
                  value={formData.lastName ?? ''}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Eze"
                  required
                  className="h-12 rounded-xl border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Email Address</Label>
                <Input
                  type="email"
                  value={formData.email ?? ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@example.com"
                  className="h-12 rounded-xl border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.phone ?? ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234..."
                  className="h-12 rounded-xl border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Gender *</Label>
                <select
                  value={formData.gender ?? 'Male'}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Staff Role / Designation *</Label>
                <select
                  value={formData.role ?? 'ACCOUNTANT'}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800"
                >
                  {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Department</Label>
                <Input
                  value={formData.department ?? ''}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Bursary / Operations"
                  className="h-12 rounded-xl border-slate-200 font-bold"
                />
              </div>
            </div>

            {/* Reusable CV PDF Upload Component */}
            <CvUploadField
              schoolId={schoolId}
              userId={formData.firstName ? `${formData.firstName.toLowerCase()}-${Date.now()}` : 'temp-staff'}
              role="institutional-staff"
              label="CV Document (PDF)"
              required={false}
              onUploaded={(publicUrl) => setCvUrl(publicUrl)}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-14 rounded-2xl text-lg shadow-xl gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Users className="w-6 h-6 text-orange-500" />}
              Enroll Staff & Generate Code
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
