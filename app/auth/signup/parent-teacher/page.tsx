'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Users, Loader2, AlertCircle, Laptop, Briefcase, Plus, X, CreditCard, Banknote, ShieldCheck } from 'lucide-react'
import { registerParentTeacher } from '@/app/actions/auth-server'
import { Badge } from '@/components/ui/badge'

export default function ParentTeacherSignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Child's Info according to Birth Certificate
    childFirstName: '',
    childMiddleName: '',
    childLastName: '',
    childDOB: '',
    childClass: 'Primary 3',
  })

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const classesList = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      alert('Passwords do not match')
      return
    }

    if (!profileImage) {
      return alert('Please upload a passport photo.')
    }

    setLoading(true)

    const payload = {
      ...formData,
      profileImage,
    }

    try {
      const result = await registerParentTeacher(payload)

      if (result.error) {
        setError(result.error)
        alert(result.error)
        setLoading(false)
      } else {
        if (result.checkoutUrl) {
          window.location.assign(result.checkoutUrl)
          return
        }
        setError('Registration was created, but checkout could not be started. Please contact support.')
        setLoading(false)
      }
    } catch (err: any) {
      setError('Account failed to create')
      alert('Account failed to create')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-orange-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-orange-600">ACADEMY</span></span>
      </div>

      <Card className="max-w-xl w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 bg-orange-600 w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-orange-100 p-4 rounded-2xl w-fit mb-4">
            <Briefcase className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900 leading-none">Parent who is a Teacher</CardTitle>
          <CardDescription className="text-slate-500 font-bold mt-2">
            Onboard as a Parent who is also an educator/staff member of EL GOODNEWS ACADEMY.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Passport picture Upload Block */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Passport Photograph</Label>
              {profileImage ? (
                <div className="relative">
                  <img src={profileImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-orange-200 shadow-lg" />
                  <button
                    type="button"
                    onClick={() => setProfileImage(null)}
                    className="absolute -bottom-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 text-xs font-bold"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <Users className="w-16 h-16 bg-slate-100 p-3 rounded-full text-slate-400 border border-slate-200" />
                </div>
              )}

              <div className="relative w-full text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {profileImage ? 'Change passport photo:' : 'Upload a passport photograph (JPG or PNG):'}
                </p>
                <div className="relative inline-block mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  />
                  <Button type="button" variant="outline" className="border-slate-200 text-slate-700 font-bold text-xs h-10 px-4 rounded-xl">
                    Select Passport Image
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-xs font-black text-orange-950 bg-orange-50 border border-orange-100 p-4 rounded-2xl">
              🔑 STAGE 1: ENTER PARENT / TEACHER PROFILE INFORMATION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-orange-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-orange-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-orange-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone / WhatsApp Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234..."
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-orange-600"
                />
              </div>
            </div>

            <div className="text-xs font-black text-amber-950 bg-amber-50 border border-amber-100 p-4 rounded-2xl">
              👶 STAGE 2: ENTER REGISTERED CHILD/WARD DETAIL
            </div>

            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-[10px] font-bold text-orange-950">
              ⚠️ CRITICAL: Enter student's first, middle, and last names exactly as printed on their Birth Certificate.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="childFirstName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">First Name</Label>
                <Input
                  id="childFirstName"
                  placeholder="Chidi"
                  value={formData.childFirstName}
                  onChange={e => setFormData({...formData, childFirstName: e.target.value})}
                  required
                  className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="childMiddleName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Middle Name</Label>
                <Input
                  id="childMiddleName"
                  placeholder="Bello"
                  value={formData.childMiddleName}
                  onChange={e => setFormData({...formData, childMiddleName: e.target.value})}
                  className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="childLastName" className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Last Name</Label>
                <Input
                  id="childLastName"
                  placeholder="Doe"
                  value={formData.childLastName}
                  onChange={e => setFormData({...formData, childLastName: e.target.value})}
                  required
                  className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childDOB" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Child's Date of Birth</Label>
                <Input
                  id="childDOB"
                  type="date"
                  value={formData.childDOB}
                  onChange={e => setFormData({...formData, childDOB: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childClass" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Child's Class</Label>
                <select
                  id="childClass"
                  value={formData.childClass}
                  onChange={e => setFormData({...formData, childClass: e.target.value})}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800 focus:outline-none"
                >
                  {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Mandatory Registration Fee payment information */}
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest">💸 STAGE 3: REGISTRATION FEE (₦2,000)</p>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-950">Pre-Approved Educator Benefit</p>
                  <p className="text-[11px] text-emerald-800 font-bold mt-1">
                    Your ₦2,000 Child Registration Fee is processed automatically! Upon registration, this transaction is logged directly as PAID in your ledger history, enabling instant portal access.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" title="confirm-password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-orange-200 mt-6 transition-all"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Complete Registration'}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm font-bold text-slate-400">
            Already have an account? <Link href="/auth/signin" className="text-orange-600 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-10 text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
        built by ELCODERS by E.V.E
      </p>
    </div>
  )
}
