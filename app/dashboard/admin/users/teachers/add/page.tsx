'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTeacher } from '@/app/actions/admin'
import { UserPlus, Briefcase, GraduationCap } from 'lucide-react'

export default function AddTeacherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'StaffPassword123!',
    qualification: '',
    specialization: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createTeacher(formData)
      alert('Teacher account created successfully!')
      router.push('/dashboard/admin/users/teachers/list')
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Failed to create teacher.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Add Academic Staff</h1>
          <p className="text-slate-500 font-medium text-lg">Create a professional profile for a new faculty member.</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-10 bg-amber-50/50">
            <CardTitle className="text-2xl font-black text-amber-900 flex items-center gap-3">
               <Briefcase className="w-8 h-8" /> Staff Details
            </CardTitle>
            <CardDescription>Professional and account information for the teacher.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">First Name</Label>
                  <Input
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Last Name</Label>
                  <Input
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Professional Email</Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@elgoodnews.edu.ng"
                  className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Highest Qualification</Label>
                  <Input
                    value={formData.qualification}
                    onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                    placeholder="e.g. M.Ed, B.Sc"
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Area of Specialization</Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    placeholder="e.g. Pure Mathematics"
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                 <div className="p-2 bg-white rounded-lg shadow-sm">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                 </div>
                 <p className="text-xs text-slate-500 font-medium">
                    New staff will use their email to sign in. The initial password is <span className="font-bold text-slate-900">StaffPassword123!</span>
                 </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-16 rounded-2xl font-black text-xl transition-all shadow-xl"
              >
                {loading ? 'Registering Staff...' : 'Create Staff Account'} <UserPlus className="ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
