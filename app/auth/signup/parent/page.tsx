'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Loader2, AlertCircle, GraduationCap, User, Search, Link as LinkIcon, CheckCircle, Trash2, Building2 } from 'lucide-react'
import { registerParent } from '@/app/actions/auth-server'
import { checkWardLinkingStatus } from '@/app/actions/user'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ParentSignUpPage() {
  const [formData, setFormData] = useState({
    schoolCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    occupation: '',
    password: '',
    confirmPassword: ''
  })

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

    if (!formData.schoolCode) {
      setError('School Registration Code is required.')
      toast.error('School Registration Code is required.')
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
      schoolCode: formData.schoolCode.trim().toUpperCase(),
      profileImage,
      facialVerificationVideo: null,
      wardAdmissionNumbers: addedWards.map(w => w.admissionNumber)
    }

    try {
      const result = await registerParent(payload)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        setLoading(false)
      } else {
        toast.success('Parent account registered successfully! Proceeding to Sign In.')
        router.push('/auth/signin')
      }
    } catch (err) {
      setError('Account failed to create')
      toast.error('Account failed to create')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-emerald-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-white">EL LEARN App <span className="text-emerald-400">ACADEMY</span></span>
      </div>

      <Card className="max-w-2xl w-full border border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
        <div className="h-2 bg-emerald-500 w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl w-fit mb-4">
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
          <CardTitle className="text-3xl font-black text-white">Parent Registration</CardTitle>
          <CardDescription className="text-slate-400 font-bold mt-2">
            Monitor up to 5 wards, pay fees, and track performance logs in real-time
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
            <div className="space-y-2 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
              <Label htmlFor="schoolCode" className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> School Registration Code *
              </Label>
              <Input
                id="schoolCode"
                placeholder="e.g. EGIA-19001"
                value={formData.schoolCode}
                onChange={e => setFormData({ ...formData, schoolCode: e.target.value.toUpperCase() })}
                required
                className="h-11 rounded-xl border-slate-800 bg-slate-950 text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Passport picture Upload Block */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
              <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Passport Photograph</Label>
              {profileImage ? (
                <div className="relative">
                  <img src={profileImage} alt="Profile" className="w-28 h-28 object-cover rounded-full border-4 border-emerald-500 shadow-lg" />
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
                  placeholder="John"
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
                  placeholder="Doe"
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
                  placeholder="john.doe@example.com"
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

            <div className="space-y-2">
              <Label htmlFor="occupation" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Occupation</Label>
              <Input
                id="occupation"
                placeholder="e.g. Civil Servant, Engineer"
                value={formData.occupation}
                onChange={e => setFormData({...formData, occupation: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-800 bg-slate-950 text-white"
              />
            </div>

            {/* Ward Search Panel */}
            <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-4">
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Search and Add Wards (Up to 5)</p>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter ward's admission number (e.g. EGIA-S-123456)"
                  value={wardAdmissionNumber}
                  onChange={e => setWardAdmissionNumber(e.target.value.toUpperCase())}
                  className="h-11 rounded-xl border-slate-800 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider"
                />
                <Button type="button" onClick={handleSearchWard} disabled={searching} className="bg-emerald-600 hover:bg-emerald-500 h-11 px-4 rounded-xl shrink-0">
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
                    <Badge className="border-none font-black text-[8px] px-2.5 py-0.5 tracking-wider uppercase bg-emerald-500/20 text-emerald-400">
                      FOUND
                    </Badge>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCheckedWard(null)} className="text-xs font-bold rounded-lg text-slate-400">Cancel</Button>
                    <Button type="button" size="sm" onClick={handleAddWard} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1">
                      <LinkIcon size={12} /> Add to Registration
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Added Wards List */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Added Wards ({addedWards.length}/5)</Label>
              {addedWards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addedWards.map(w => (
                    <div key={w.admissionNumber} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white">{w.name}</p>
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{w.admissionNumber} • {w.class}</p>
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
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-14 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 mt-6 transition-all"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Create Parent Account'}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm font-bold text-slate-400">
            Already have an account? <Link href="/auth/signin" className="text-emerald-400 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
