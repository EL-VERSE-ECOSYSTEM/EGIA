'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Loader2, AlertCircle, GraduationCap, User, Search, Link as LinkIcon, CheckCircle, Trash2, Sparkles, Building2 } from 'lucide-react'
import { registerParent } from '@/app/actions/auth-server'
import { checkWardLinkingStatus } from '@/app/actions/user'
import { Badge } from '@/components/ui/badge'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
import { toast } from 'sonner'

export default function ParentSignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    email: '',
    phone: '',
    occupation: '',
    schoolCode: '',
    password: '',
    confirmPassword: ''
  })

  // 3D Mouse Movement Tilt
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.getBoundingClientRect()
    const cardX = e.clientX - card.left - card.width / 2
    const cardY = e.clientY - card.top - card.height / 2
    setRotateX(-cardY / 50)
    setRotateY(cardX / 50)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  // Ward Search and Array states
  const [wardAdmissionNumber, setWardAdmissionNumber] = useState('')
  const [searching, setSearching] = useState(false)
  const [checkedWard, setCheckedWard] = useState<any | null>(null)
  const [addedWards, setAddedWards] = useState<any[]>([])

  // Profile image upload
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

  const handleSearchWard = async () => {
    if (!wardAdmissionNumber.trim()) {
      toast.error('Please enter an admission number')
      return
    }
    setSearching(true)
    setCheckedWard(null)
    try {
      const res = await checkWardLinkingStatus(wardAdmissionNumber.trim().toUpperCase())
      if (res.found) {
        setCheckedWard(res)
      } else {
        toast.error(res.message || 'Ward not found')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error checking ward status')
    } finally {
      setSearching(false)
    }
  }

  const handleAddWard = () => {
    if (!checkedWard) return
    if (addedWards.length >= 5) {
      toast.error('A parent account can be linked to a maximum of 5 children.')
      return
    }
    if (addedWards.some(w => w.admissionNumber === checkedWard.admissionNumber)) {
      toast.error('This ward is already added to your list.')
      return
    }
    setAddedWards([...addedWards, checkedWard])
    setCheckedWard(null)
    setWardAdmissionNumber('')
    toast.success('Ward added to registration list!')
  }

  const handleRemoveWard = (admNum: string) => {
    setAddedWards(addedWards.filter(w => w.admissionNumber !== admNum))
    toast.success('Ward removed from list')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      toast.error('Password must be at least 8 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    if (!profileImage) {
      toast.error('Please upload a passport photo.')
      return
    }

    if (addedWards.length === 0) {
      toast.error('Please link at least 1 ward to complete parent registration.')
      return
    }

    setLoading(true)

    const payload = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      occupation: formData.occupation.trim(),
      schoolCode: formData.schoolCode.trim().toUpperCase(),
      profileImage,
      facialVerificationVideo: null,
      wardAdmissionNumbers: addedWards.map(w => w.admissionNumber)
    }

    try {
      const result: any = await registerParent(payload)

      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
        setLoading(false)
      } else {
        if (result?.checkoutUrl) {
          window.location.assign(result.checkoutUrl)
          return
        }
        toast.success('Parent account registered successfully! Proceeding to Sign In.')
        router.push('/auth/signin')
      }
    } catch (err: any) {
      const msg = err?.message || 'Account failed to create. Please try again.'
      setError(msg)
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden perspective-[1200px]">
      {/* Dynamic Background Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <header className="relative max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 backdrop-blur-md shadow-lg text-indigo-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-black text-xl tracking-tight text-white uppercase">
            EL <span className="text-indigo-400">LEARNERS APP</span>
          </span>
        </div>
        <Link href="/auth/signin" className="text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          Already registered? Sign In
        </Link>
      </header>

      <main
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out'
        }}
        className="relative max-w-3xl mx-auto w-full my-8 bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-10"
      >
        <div className="mb-8 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Guardian Portal Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Parent & Guardian Registration
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold leading-relaxed">
            Monitor up to 5 wards, review report cards in real-time, pay school fees, and enroll in Adult Education programs.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Passport picture Upload Block */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Passport Photograph *</Label>
            {profileImage ? (
              <div className="relative">
                <img src={profileImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-indigo-500 shadow-lg" />
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender *</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950 px-3 font-bold text-white focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234..."
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="occupation" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Occupation *</Label>
              <Input
                id="occupation"
                placeholder="e.g. Civil Servant, Engineer"
                value={formData.occupation}
                onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="schoolCode" className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">School Registration Code (Optional)</Label>
              <Input
                id="schoolCode"
                placeholder="e.g. EXCE-12345"
                value={formData.schoolCode}
                onChange={async e => {
                  const code = e.target.value.toUpperCase()
                  setFormData({ ...formData, schoolCode: code })
                  if (code.length >= 5) {
                    const { getSchoolByCodeAction } = await import('@/app/actions/school')
                    const res = await getSchoolByCodeAction(code)
                    if (res.success && res.school) {
                      if (!res.school.allowParents) {
                        setError(`Parent registration is disabled for ${res.school.name}. Please contact school administration.`)
                        toast.error(`Parent registration is disabled for ${res.school.name}`)
                      } else {
                        setError(null)
                        toast.success(`School verified: ${res.school.name}`)
                      }
                    } else {
                      setError('Invalid School Code. Please verify with school admin.')
                    }
                  } else {
                    setError(null)
                  }
                }}
                className="h-12 rounded-xl border-indigo-500/40 bg-slate-950 font-mono font-bold text-white uppercase tracking-wider focus:outline-none"
              />
            </div>
          </div>

          {/* Ward Search Panel */}
          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
            <p className="text-xs font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Search and Add Wards (Up to 5)
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Enter ward's admission number (e.g. EGIA-S-123456)"
                value={wardAdmissionNumber}
                onChange={e => setWardAdmissionNumber(e.target.value.toUpperCase())}
                className="h-11 rounded-xl border-slate-800 bg-slate-900 text-xs font-bold uppercase text-white tracking-wider"
              />
              <Button type="button" onClick={handleSearchWard} disabled={searching} className="bg-indigo-600 hover:bg-indigo-500 h-11 px-4 rounded-xl shrink-0 text-white">
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>

            {/* Searched Ward Details */}
            {checkedWard && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-black text-white">{checkedWard.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{checkedWard.admissionNumber} • {checkedWard.class}</p>
                  </div>
                  <Badge className={`border-none font-black text-[8px] px-2.5 py-0.5 tracking-wider uppercase ${
                    checkedWard.status === 'NOT_LINKED'
                      ? 'bg-amber-500/20 text-amber-300'
                      : checkedWard.status === 'LINKED_TO_ME'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {checkedWard.status.replaceAll('_', ' ')}
                  </Badge>
                </div>

                <p className="text-[11px] font-semibold text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  {checkedWard.message}
                </p>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCheckedWard(null)} className="text-xs font-bold text-slate-400 rounded-lg">Cancel</Button>
                  {checkedWard.status === 'NOT_LINKED' && (
                    <Button type="button" size="sm" onClick={handleAddWard} className="bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold rounded-lg flex items-center gap-1">
                      <LinkIcon size={12} /> Add to Registration
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Added Wards List */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Added Wards ({addedWards.length}/5) *</Label>
            {addedWards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addedWards.map(w => (
                  <div key={w.admissionNumber} className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">{w.name}</p>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{w.admissionNumber} • {w.class}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveWard(w.admissionNumber)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-800 rounded-2xl text-center text-slate-500 font-bold text-xs">
                No wards added yet. Search and link up to 5 wards above to complete registration.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
            />
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white font-bold"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/30 transition-all uppercase tracking-wider"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Register Parent Account'}
          </Button>
        </form>
      </main>

      <footer className="relative max-w-5xl mx-auto w-full text-center py-4 border-t border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest z-10">
        &copy; {new Date().getFullYear()} EL LEARNERS APP • Guardian Portal
      </footer>
    </div>
  )
}
