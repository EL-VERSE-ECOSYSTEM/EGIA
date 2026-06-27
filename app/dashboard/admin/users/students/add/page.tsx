'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createStudent } from '@/app/actions/admin'
import { UserPlus, ShieldCheck, Calendar, School } from 'lucide-react'

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Password123!',
    admissionNumber: '',
    class: '',
    gender: 'MALE',
    academicSession: '2024/2025',
    term: 'First Term'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createStudent(formData)
      alert('Student profile created and enrolled successfully!')
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
      <div className="p-8 max-w-5xl mx-auto space-y-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Institutional Enrollment</h1>
          <p className="text-slate-500 font-medium text-lg text-pretty">Enroll students for the current academic session. For parents without mobile devices, the admin creates the profile directly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-10 bg-amber-50/30 border-b border-amber-50">
              <CardTitle className="text-2xl font-black text-amber-900">Student Identity</CardTitle>
              <CardDescription>Primary details for the new student.</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSubmit} id="enroll-form" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                    <Input
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</Label>
                    <Input
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Guardian Email (Optional)</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="parent@example.com"
                      className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admission Number</Label>
                    <Input
                      required
                      value={formData.admissionNumber}
                      onChange={(e) => setFormData({...formData, admissionNumber: e.target.value.toUpperCase()})}
                      placeholder="GODXXXXX"
                      className="h-14 rounded-2xl bg-slate-50 border-none font-black tracking-widest focus:bg-white focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Gender</Label>
                    <Select defaultValue="MALE" onValueChange={(v) => setFormData({...formData, gender: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="MALE">Male</SelectItem>
                         <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Level</Label>
                    <Select onValueChange={(v) => setFormData({...formData, class: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black">
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
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Academic Context</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Session</Label>
                    <Select defaultValue="2024/2025">
                       <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="2024/2025">2024/2025</SelectItem>
                          <SelectItem value="2025/2026">2025/2026</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Term</Label>
                    <Select defaultValue="First Term">
                       <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="First Term">First Term</SelectItem>
                          <SelectItem value="Second Term">Second Term</SelectItem>
                          <SelectItem value="Third Term">Third Term</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-none rounded-[2.5rem] p-8 text-white">
               <div className="flex items-start gap-4">
                  <ShieldCheck className="text-amber-500 w-8 h-8 shrink-0" />
                  <div className="space-y-6">
                     <div>
                        <p className="font-black text-lg">Verification Note</p>
                        <p className="text-sm text-slate-400 font-medium">This enrollment creates a permanent record in the school database. Ensure all information matches legal documents.</p>
                     </div>
                     <Button
                        type="submit"
                        form="enroll-form"
                        disabled={loading}
                        className="w-full h-16 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-lg shadow-xl shadow-amber-900/20"
                     >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : 'CONFIRM ENROLLMENT'}
                     </Button>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

import { Loader2 as Loader } from 'lucide-react'
