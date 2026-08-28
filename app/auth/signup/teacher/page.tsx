'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClipboardCheck, Loader2, AlertCircle, GraduationCap, User, Building2 } from 'lucide-react'
import { registerTeacher } from '@/app/actions/auth-server'

export default function TeacherSignUpPage() {
  const [formData, setFormData] = useState({
    schoolCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    password: '',
    confirmPassword: ''
  })

  // Profile picture upload
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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

    if (!formData.schoolCode) {
      setError('School Registration Code is required.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!profileImage) {
      setError('Please upload a passport photo.')
      return
    }

    setLoading(true)

    const payload = {
      ...formData,
      schoolCode: formData.schoolCode.trim().toUpperCase(),
      profileImage,
      type: 'FULL_TIME',
      handlingClasses: [],
      teachingSubjects: [],
      presentDays: []
    }

    try {
      const result = await registerTeacher(payload)

      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        alert(`Staff account registered successfully! Your Staff ID is: ${result.staffCode}`)
        router.push('/auth/signin')
      }
    } catch (err) {
      setError('Account failed to create')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-purple-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-white">EL LEARN App <span className="text-purple-400">ACADEMY</span></span>
      </div>

      <Card className="max-w-xl w-full border border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
        <div className="h-2 bg-purple-600 w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl w-fit mb-4">
            <ClipboardCheck className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-3xl font-black text-white">Staff / Educator Registration</CardTitle>
          <CardDescription className="text-slate-400 font-bold mt-2">
            Create an instructor account linked to your school
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* School Registration Code */}
            <div className="space-y-2 bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl">
              <Label htmlFor="schoolCode" className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> School Registration Code *
              </Label>
              <Input
                id="schoolCode"
                placeholder="e.g. EGIA-19001"
                value={formData.schoolCode}
                onChange={e => setFormData({ ...formData, schoolCode: e.target.value.toUpperCase() })}
                required
                className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white font-mono uppercase focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Passport picture Upload Block */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Passport Photograph</Label>
              {profileImage ? (
                <div className="relative">
                  <img src={profileImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-purple-500 shadow-lg" />
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
                  <User className="w-16 h-16 bg-slate-900 p-3 rounded-full text-slate-400 border border-slate-800" />
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
                  <Button type="button" variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 font-bold text-xs h-10 px-4 rounded-xl">
                    Select Passport Image
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane.smith@school.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234..."
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Qualification</Label>
                <Input
                  id="qualification"
                  placeholder="e.g. B.Ed, B.Sc"
                  value={formData.qualification}
                  onChange={e => setFormData({...formData, qualification: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Mathematics"
                  value={formData.specialization}
                  onChange={e => setFormData({...formData, specialization: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
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
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
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
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/20 mt-6 transition-all"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Register Staff Account'}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm font-bold text-slate-400">
            Already have an account? <Link href="/auth/signin" className="text-purple-400 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
