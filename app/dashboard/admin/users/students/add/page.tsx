'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createStudent } from '@/app/actions/admin'
import { UserPlus, ShieldCheck } from 'lucide-react'

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Password123!', // Default password
    admissionNumber: '',
    class: '',
    gender: 'MALE'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createStudent(formData)
      alert('Student created successfully!')
      router.push('/dashboard/admin/users/students/list')
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Failed to create student.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Register New Student</h1>
          <p className="text-slate-500 font-medium text-lg">Create a new student profile and system account.</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-10 bg-amber-50/50">
            <CardTitle className="text-2xl font-black text-amber-900">Student Particulars</CardTitle>
            <CardDescription>All fields are required for academic records.</CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="student@elgoodnews.edu.ng"
                    className="h-12 rounded-xl bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Admission Number</Label>
                  <Input
                    required
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({...formData, admissionNumber: e.target.value.toUpperCase()})}
                    placeholder="GODXXXXX"
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Initial Class</Label>
                  <Select onValueChange={(v) => setFormData({...formData, class: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="JSS1">JSS 1</SelectItem>
                       <SelectItem value="JSS2">JSS 2</SelectItem>
                       <SelectItem value="JSS3">JSS 3</SelectItem>
                       <SelectItem value="SSS1">SSS 1</SelectItem>
                       <SelectItem value="SSS2">SSS 2</SelectItem>
                       <SelectItem value="SSS3">SSS 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Gender</Label>
                  <Select defaultValue="MALE" onValueChange={(v) => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="MALE">Male</SelectItem>
                       <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                       <ShieldCheck className="text-amber-400 w-6 h-6" />
                    </div>
                    <div>
                       <p className="font-black text-sm">Security Note</p>
                       <p className="text-xs text-slate-400">Default password is: <span className="text-white font-mono">Password123!</span></p>
                    </div>
                 </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 h-16 rounded-2xl font-black text-xl transition-all shadow-xl"
              >
                {loading ? 'Creating Student Profile...' : 'Complete Enrollment'} <UserPlus className="ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
