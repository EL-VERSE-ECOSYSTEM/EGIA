'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react'
import { updateStudentPassword } from '@/app/actions/user'

export default function StudentPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long')
      return
    }

    setLoading(true)
    try {
      const result = await updateStudentPassword(password)
      if (result.success) {
        setSuccess(true)
        setPassword('')
        setConfirmPassword('')
        alert('Your portal login password has been customized successfully! You can now log in using your new custom password.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-2xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Create Custom Password</h1>
          <p className="text-slate-500 text-lg font-medium">Configure your own personalized access password for EL LEARN App.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="h-2 bg-orange-600 w-full" />
          <CardHeader className="p-10 pb-4">
            <div className="flex items-center gap-3">
              <KeyRound className="w-8 h-8 text-orange-600" />
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Portal Credentials</CardTitle>
                <CardDescription className="text-slate-400 font-bold">Customize your password from default settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <div className="p-4 bg-orange-50 border border-orange-100 text-orange-950 text-xs font-bold rounded-2xl">
              💡 Tip: Since Student/Pupil login only requires your unique Admission Number, we set the initial default password to "default". Setting a custom password here protects your account.
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-black rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
                  Password updated successfully!
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-slate-700 font-bold">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter custom password"
                  required
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" title="confirm-password" className="text-slate-700 font-bold">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter custom password"
                  required
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save New Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
