'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSchoolAdmin } from '@/app/actions/admin'
import { ShieldAlert, UserPlus, Mail, Lock, Phone, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AddAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast.error('Please fill in Admin Name and Email Address.')
      return
    }

    setLoading(true)
    try {
      const res = await createSchoolAdmin(form)
      if (res.success) {
        toast.success(`School Admin '${form.name}' added successfully in real time!`)
        router.push('/dashboard/admin/users/admins/list')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add School Admin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <span className="bg-blue-100 text-[#1E3A8A] border border-blue-200 text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full">
            Institutional Administration Management
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-3">Add Co-School Administrator</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            Grant full administrative privileges to additional team members to manage academics, CBT, finance, and users.
          </p>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
          <CardHeader className="p-0 pb-6 border-b border-slate-100 mb-6">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#1E3A8A]" /> Administrator Credentials & Access
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold text-xs">
              Account will be immediately provisioned with real-time Supabase Database synchronization.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Dr. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 font-bold text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Admin Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="admin@school.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Initial Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Defaults to AdminPass123!"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs font-bold leading-relaxed">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black">Security Notice:</p>
                Adding an Administrator gives full management rights over school records, finances, CBT exams, and user accounts.
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#1E3A8A] hover:bg-blue-800 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              CREATE SCHOOL ADMINISTRATOR ACCOUNT
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
