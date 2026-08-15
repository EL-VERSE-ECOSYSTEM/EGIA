'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Lock,
  Bell
} from 'lucide-react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { getParentProfile, updateParentProfile } from '@/app/actions/user'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ParentProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [occupation, setOccupation] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const loadProfile = async () => {
    try {
      const data = await getParentProfile()
      if (data) {
        setFirstName(data.firstName || '')
        setLastName(data.lastName || '')
        setEmail(data.user?.email || '')
        setPhoneNumber(data.phoneNumber || '')
        setOccupation(data.occupation || '')
        setAddress(data.address || '')
        setProfileImage(data.profileImage || null)
      }
    } catch (err) {
      console.error('Failed to load parent profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  // Real-time Supabase Database Sync for Parent Profile Settings
  useRealtimeSubscription('parent', () => {
    loadProfile()
    toast('Profile data updated in real time')
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateParentProfile({
        firstName,
        lastName,
        phoneNumber,
        occupation,
        address,
        profileImage: profileImage || undefined
      })
      toast.success('Parent profile settings saved successfully in real time!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Parent Account Settings</h1>
          <p className="text-slate-500 font-medium">Manage your profile, contact details, and address with real-time Supabase synchronization.</p>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing profile from database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="overflow-hidden border-none shadow-xl rounded-[2rem]">
                <div className="h-24 bg-emerald-600"></div>
                <CardContent className="pt-0 -mt-12 text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden mx-auto">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">{firstName} {lastName}</h2>
                  <p className="text-xs text-slate-500 font-bold">{email}</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-800 border-none font-black text-[10px]">Verified Parent Account</Badge>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="text-2xl font-black text-slate-900">Personal & Contact Info</CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">Update details synced in real time across the portal.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-xs font-bold text-slate-700">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-xs font-bold text-slate-700">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-slate-700">Email Address (Read-only)</Label>
                        <Input id="email" value={email} disabled className="h-12 rounded-xl bg-slate-50 font-semibold" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold text-slate-700">Phone / WhatsApp Number</Label>
                        <Input
                          id="phone"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value)}
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-xs font-bold text-slate-700">Occupation</Label>
                      <Input
                        id="occupation"
                        value={occupation}
                        onChange={e => setOccupation(e.target.value)}
                        placeholder="e.g. Civil Servant / Engineer"
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs font-bold text-slate-700">Home Address</Label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter full residential address..."
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-8 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-200"
                      >
                        {saving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                        Save Profile Settings
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
