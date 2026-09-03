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
import { UserPlus, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ParentEnrollStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    class: '',
    gender: 'MALE'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result: any = await createStudent(formData)
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/parent/children/list'), 3000)
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Failed to enroll student.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout role="parent">
        <div className="min-h-[60vh] flex items-center justify-center p-8">
           <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] p-12 text-center space-y-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                 <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-900">Enrollment Successful!</h2>
              <p className="text-slate-500 font-medium">Your child has been enrolled. An admission number has been generated. Redirecting to your dashboard...</p>
           </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <Link href="/dashboard/parent/children/list" className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest hover:translate-x-[-4px] transition-transform w-fit">
          <ArrowLeft size={16} /> Back to Children
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">New Enrollment</h1>
          <p className="text-slate-500 font-medium text-lg text-pretty">Enroll your ward directly into EL LEARNERS App.</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <div className="h-2 bg-emerald-600 w-full" />
          <CardHeader className="p-10">
            <CardTitle className="text-2xl font-black text-slate-900">Child's Information</CardTitle>
            <CardDescription className="text-slate-400 font-bold">Please fill in the legal details of your ward.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                  <Input
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Enter first name"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</Label>
                  <Input
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Enter last name"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Class</Label>
                  <Select onValueChange={(v) => setFormData({...formData, class: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                      <SelectValue placeholder="Select level" />
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
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Gender</Label>
                  <Select defaultValue="MALE" onValueChange={(v) => setFormData({...formData, gender: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="MALE">Male</SelectItem>
                       <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-slate-200">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-2xl">
                       <ShieldCheck className="text-amber-400 w-8 h-8" />
                    </div>
                    <div>
                       <p className="font-black text-lg">Enrollment Policy</p>
                       <p className="text-sm text-slate-400 font-medium">An admission number will be generated automatically upon approval.</p>
                    </div>
                 </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-20 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-emerald-200"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : 'SUBMIT ENROLLMENT REQUEST'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
