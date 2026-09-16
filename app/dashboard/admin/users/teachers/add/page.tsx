'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTeacher } from '@/app/actions/admin'
import { UserPlus, Briefcase, GraduationCap, FileText, Calendar } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { CvUploadField } from '@/components/uploads/CvUploadField'

export default function AddTeacherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'Male',
    password: 'StaffPassword123!',
    qualification: '',
    specialization: '',
    type: 'FULL_TIME',
    isClassTeacher: false,
    assignedClassId: '',
    daysPresent: [] as string[],
    applicationLetterUrl: '',
    cvUrl: ''
  })

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysPresent: prev.daysPresent.includes(day)
        ? prev.daysPresent.filter(d => d !== day)
        : [...prev.daysPresent, day]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createTeacher(formData)
      alert('Teacher account created successfully! Admin has approved the enrollment.')
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
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Institutional Staff Enrollment</h1>
          <p className="text-slate-500 font-medium text-lg">Onboard professional educators with full credential verification.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 bg-amber-50/50 border-b border-amber-100">
                <CardTitle className="text-2xl font-black text-amber-900 flex items-center gap-3">
                   <Briefcase className="w-8 h-8" /> Identity & Profile
                </CardTitle>
                <CardDescription>Primary account and personal information.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">First Name</Label>
                      <Input
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">Last Name</Label>
                      <Input
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">Professional Email</Label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="teacher@egia.com"
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold focus:bg-white focus:ring-amber-600 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">Phone Number</Label>
                      <Input
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        placeholder="e.g. 08012345678"
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold focus:bg-white focus:ring-amber-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">Gender</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="Male" className="font-bold py-3">Male</SelectItem>
                          <SelectItem value="Female" className="font-bold py-3">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">Qualification</Label>
                      <Input
                        value={formData.qualification}
                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                        placeholder="e.g. B.Ed, M.Sc"
                        className="h-14 rounded-2xl bg-slate-50 border-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">Qualification</Label>
                      <Input
                        value={formData.qualification}
                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                        placeholder="e.g. B.Ed, M.Sc"
                        className="h-14 rounded-2xl bg-slate-50 border-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px] ml-1">Specialization</Label>
                      <Input
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        placeholder="e.g. Physics"
                        className="h-14 rounded-2xl bg-slate-50 border-none transition-all"
                      />
                    </div>
                  </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                   <FileText className="w-8 h-8 text-amber-600" /> Credentials & Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <CvUploadField
                       schoolId="school-elgoodnews-001"
                       userId="temp"
                       role="teachers"
                       label="CV (PDF)"
                       existingUrl={formData.cvUrl}
                       onUploaded={(publicUrl) => setFormData(prev => ({ ...prev, cvUrl: publicUrl }))}
                     />
                     <CvUploadField
                       schoolId="school-elgoodnews-001"
                       userId="temp"
                       role="teachers"
                       label="Application Letter (PDF)"
                       existingUrl={formData.applicationLetterUrl}
                       onUploaded={(publicUrl) => setFormData(prev => ({ ...prev, applicationLetterUrl: publicUrl }))}
                     />
                  </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
             <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                   <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Employment Terms</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-700 tracking-widest ml-1">Contract Type</Label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                         <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="FULL_TIME" className="font-bold py-3">Full Time</SelectItem>
                            <SelectItem value="PART_TIME" className="font-bold py-3">Part Time</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>

                   {formData.type === 'FULL_TIME' ? (
                     <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <Checkbox
                          id="classTeacher"
                          checked={formData.isClassTeacher}
                          onCheckedChange={(c) => setFormData({...formData, isClassTeacher: !!c})}
                        />
                        <label htmlFor="classTeacher" className="text-sm font-black text-amber-900 cursor-pointer">Assigned as Class Teacher?</label>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-700 tracking-widest ml-1">Days of Presence</Label>
                        <div className="grid grid-cols-1 gap-2">
                           {days.map(day => (
                             <div key={day} className="flex items-center gap-3">
                                <Checkbox id={day} checked={formData.daysPresent.includes(day)} onCheckedChange={() => toggleDay(day)} />
                                <label htmlFor={day} className="text-sm font-bold text-slate-600">{day}</label>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}

                   <div className="space-y-3 pt-4 border-t border-slate-50">
                      <Label className="text-[10px] font-black uppercase text-slate-700 tracking-widest ml-1">Initial Subjects (Optional)</Label>
                      <p className="text-[10px] font-medium text-slate-400">Subjects will be assigned per class after enrollment.</p>
                   </div>
                </CardContent>
             </Card>

             <Card className="bg-slate-900 border-none rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20">
                <div className="space-y-6">
                   <div className="flex items-start gap-4">
                      <GraduationCap className="text-amber-500 w-8 h-8 shrink-0" />
                      <div>
                        <p className="font-black text-lg">Academic Board Approval</p>
                        <p className="text-xs text-slate-400 font-medium">By submitting, you confirm that credentials have been verified by the school board.</p>
                      </div>
                   </div>
                   <Button
                     type="submit"
                     disabled={loading}
                     className="w-full h-16 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-lg transition-all"
                   >
                     {loading ? 'PROCESSING...' : 'COMPLETE ENROLLMENT'}
                   </Button>
                </div>
             </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
