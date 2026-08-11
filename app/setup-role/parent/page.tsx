'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Link as LinkIcon, User, Users, CheckCircle, AlertTriangle, ShieldCheck, X } from 'lucide-react'
import { createParentProfile, getParentProfile, getLinkedChildren, checkWardLinkingStatus, linkChild } from '@/app/actions/user'
import { toast } from 'sonner'

export default function ParentSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)

  // Profile forms
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Ward search/linking states
  const [searchNumber, setSearchNumber] = useState('')
  const [searching, setSearching] = useState(false)
  const [checkedWard, setCheckedWard] = useState<any | null>(null)
  const [linkedWards, setLinkedWards] = useState<any[]>([])

  // Load existing profile & linked wards
  const loadProfileAndWards = async () => {
    try {
      const profile = await getParentProfile()
      if (profile) {
        setHasProfile(true)
        setFirstName(profile.firstName)
        setLastName(profile.lastName)
        setPhoneNumber(profile.phoneNumber || '')
      }
      const wards = await getLinkedChildren()
      setLinkedWards(wards)
    } catch (err: any) {
      console.warn('Could not load parent info:', err)
    }
  }

  useEffect(() => {
    loadProfileAndWards()
  }, [])

  // Check Ward Status using DB parentId, sessionId and termId
  const handleCheckWard = async () => {
    if (!searchNumber.trim()) {
      toast.error('Please enter an admission number')
      return
    }
    setSearching(true)
    setCheckedWard(null)
    try {
      const res = await checkWardLinkingStatus(searchNumber)
      if (res.found) {
        setCheckedWard(res)
      } else {
        toast.error(res.message || 'Ward not found')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error checking ward status')
    } finally {
      setSearching(false)
    }
  }

  // Link child ward to account
  const handleLinkWard = async (admissionNum: string) => {
    if (linkedWards.length >= 5) {
      toast.error('A parent account can be linked to a maximum of 5 children.')
      return
    }
    setLoading(true)
    try {
      // If parent profile does not exist yet, we must create it first!
      if (!hasProfile) {
        if (!firstName || !lastName || !phoneNumber) {
          toast.error('Please fill in your first name, last name, and phone number to initialize your parent profile.')
          setLoading(false)
          return
        }
        await createParentProfile({ firstName, lastName, phoneNumber })
        setHasProfile(true)
      }

      await linkChild(admissionNum)
      toast.success('Ward linked successfully!')
      setCheckedWard(null)
      setSearchNumber('')
      await loadProfileAndWards()
    } catch (err: any) {
      toast.error(err.message || 'Linking failed')
    } finally {
      setLoading(false)
    }
  }

  // Save profile & navigate to dashboard if they have linked at least 1 child
  const handleFinishSetup = async () => {
    if (linkedWards.length === 0) {
      toast.error('Please link at least one student/pupil ward to access the portal.')
      return
    }
    router.push('/dashboard/parent/overview')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900 px-4 py-12">
      <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[2.5rem] bg-white text-slate-900 overflow-hidden">
        <div className="h-2 bg-emerald-600 w-full" />
        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">Parent Account Setup</CardTitle>
              <CardDescription className="text-slate-500 font-bold mt-1">
                Configure your parent profile and link up to 5 student/pupil wards
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 sm:p-10 space-y-8">
          {/* Profile details if not created yet */}
          {!hasProfile && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Step 1: Your Profile Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">First Name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Michael"
                    className="h-12 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Last Name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="h-12 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Phone Number</label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+234..."
                  className="h-12 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-emerald-600"
                />
              </div>
            </div>
          )}

          {/* Linking Ward search panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {hasProfile ? 'Link Wards (Up to 5 maximum)' : 'Step 2: Search and Link Wards'}
            </h3>

            <div className="flex gap-2">
              <Input
                placeholder="Enter ward's admission number (e.g. EGIA-S-00998)"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value.toUpperCase())}
                className="h-12 rounded-xl border-slate-200 font-bold uppercase tracking-wider text-xs px-4"
              />
              <Button
                onClick={handleCheckWard}
                disabled={searching}
                className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 rounded-xl font-bold flex items-center gap-2"
              >
                {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                Search
              </Button>
            </div>

            {/* Display Checked Ward Linking Status Details */}
            {checkedWard && (
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Searched Student Details</p>
                    <h4 className="text-lg font-black text-slate-900 mt-1">{checkedWard.name}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{checkedWard.admissionNumber} • {checkedWard.class}</p>
                  </div>
                  <Badge className={`border-none font-black text-[9px] px-2.5 py-1 tracking-wider uppercase ${
                    checkedWard.status === 'NOT_LINKED'
                      ? 'bg-amber-100 text-amber-700'
                      : checkedWard.status === 'LINKED_TO_ME'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {checkedWard.status.replaceAll('_', ' ')}
                  </Badge>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-xs font-bold text-slate-600 space-y-1">
                  <p><span className="text-slate-400 text-[9px] uppercase font-black tracking-wider block">Linking State Check:</span> {checkedWard.message}</p>
                  {checkedWard.sessionId && <p><span className="text-slate-400 text-[9px] uppercase font-black tracking-wider block">Session Context Bind:</span> Active Session ID: {checkedWard.sessionId}</p>}
                  {checkedWard.termId && <p><span className="text-slate-400 text-[9px] uppercase font-black tracking-wider block">Terminal Period Bind:</span> Active Term ID: {checkedWard.termId}</p>}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => setCheckedWard(null)} className="rounded-xl font-bold h-11 text-slate-500 hover:bg-slate-100">Cancel</Button>
                  {checkedWard.status === 'NOT_LINKED' && (
                    <Button
                      onClick={() => handleLinkWard(checkedWard.admissionNumber)}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl flex items-center gap-1.5"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                      Link Ward to My Account
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* List of currently linked wards */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Currently Linked Wards ({linkedWards.length}/5)</h3>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] tracking-wider px-3 py-1 uppercase">{linkedWards.length} ACTIVE</Badge>
            </div>

            {linkedWards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {linkedWards.map((w) => (
                  <div key={w.id} className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-3xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg">
                        {w.firstName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{w.firstName} {w.lastName}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{w.admissionNumber} • {w.class}</p>
                      </div>
                    </div>
                    <CheckCircle className="text-emerald-600 w-5 h-5 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-400 font-bold text-xs">
                No child wards linked to this parent account yet. Search above to link your wards!
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-bold max-w-sm">
              Note: You can link up to 5 wards. You must have at least one linked ward to proceed to the academy parent portal.
            </p>
            <Button
              onClick={handleFinishSetup}
              disabled={linkedWards.length === 0}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-sm h-14 px-8 rounded-2xl shadow-xl shadow-slate-200"
            >
              Finish Setup & Enter Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
