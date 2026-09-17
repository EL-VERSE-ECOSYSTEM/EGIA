'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { deleteUserAccount, updateStudentProfileSettingsAction, getStudentProfile } from '@/app/actions/user'
import { User, Save, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentSettingsPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('Male')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  React.useEffect(() => {
    getStudentProfile().then(p => {
      if (p) {
        setFirstName(p.firstName || '')
        setLastName(p.lastName || '')
        setGender(p.gender || 'Male')
      }
    }).catch(console.error)
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const res = await updateStudentProfileSettingsAction({
        firstName,
        lastName,
        gender
      })
      if (res.success) {
        toast.success('Student profile settings updated in real time!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile settings.')
    } finally {
      setIsSavingProfile(false)
    }
  }
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      return alert('Please type DELETE to confirm')
    }

    setIsDeleting(true)
    try {
      const res = await deleteUserAccount()
      if (res.success) {
        alert('Your account has been deleted successfully.')
        window.location.href = '/auth/signin'
      }
    } catch (err) {
      console.error(err)
      alert('Failed to delete account. Please try again later.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Account Settings</h1>
          <p className="text-slate-500 text-lg font-medium">Manage your security options and student credentials.</p>
        </div>

        {/* Personal Profile Settings Form */}
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <User className="w-6 h-6 text-amber-500" /> Learner Profile Information
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold">Update personal details synced in real time with Supabase DB</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">First Name</Label>
                  <Input
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Last Name</Label>
                  <Input
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Gender</Label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-900 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={isSavingProfile}
                className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black h-12 px-8 rounded-xl shadow-md flex items-center gap-2"
              >
                {isSavingProfile ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>SAVE REAL-TIME CHANGES</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900">Security Credentials</CardTitle>
            <CardDescription className="text-slate-400 font-bold">General security policy configurations</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-black text-slate-900">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Secure your student account with an extra verification layer.</p>
              </div>
              <Badge className="bg-slate-200 text-slate-600 border-none font-black text-xs uppercase px-4 py-1.5">DISABLED</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-2 border-red-100 bg-red-50/50 shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <div className="flex items-center gap-3 text-red-700">
              <ShieldAlert className="w-6 h-6" />
              <CardTitle className="text-2xl font-black">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-500/70 font-semibold">
              Irreversible destructive account operations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-red-100/50 pb-6">
              <div>
                <p className="font-black text-red-950 text-lg">Delete Account</p>
                <p className="text-sm font-medium text-red-700 max-w-lg mt-1 leading-relaxed">
                  Permanently erase your student profile, grades, and CBT history from EL LEARN App. This action is absolute and cannot be undone.
                </p>
              </div>
              <Button
                onClick={() => setShowConfirmModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-black h-12 px-6 rounded-2xl shrink-0 shadow-lg shadow-red-200 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete Account
              </Button>
            </div>

            {showConfirmModal && (
              <div className="p-6 bg-red-100/40 rounded-3xl border border-red-200 animate-in slide-in-from-top-4 duration-300 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-1 shrink-0" />
                  <div>
                    <p className="font-black text-red-950">Are you absolutely sure?</p>
                    <p className="text-xs text-red-700 font-bold mt-1">
                      To confirm deletion, please type <span className="font-black underline text-red-900">DELETE</span> in the box below.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Input
                    placeholder="Type DELETE"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="h-12 rounded-xl border-red-200 bg-white font-black text-red-900 focus:ring-red-600"
                  />
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== 'DELETE' || isDeleting}
                    className="bg-red-700 hover:bg-red-800 text-white font-black h-12 px-8 rounded-xl shrink-0"
                  >
                    {isDeleting ? <Loader2 className="animate-spin w-5 h-5" /> : 'CONFIRM DELETION'}
                  </Button>
                  <Button
                    onClick={() => { setShowConfirmModal(false); setDeleteConfirm(''); }}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-100/50 font-black h-12 rounded-xl"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
