'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Mail, Lock, Phone, Building, Loader2, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react'
import {
  verifyForgotPasswordEmailAction,
  confirmForgotPasswordVerificationAction,
  resetForgotPasswordPasswordAction,
} from './actions'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Form State
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [verificationType, setVerificationType] = useState<'PHONE' | 'SCHOOL_CODE'>('PHONE')
  const [verificationInput, setVerificationInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Request Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await verifyForgotPasswordEmailAction(email)
      if (!res.success || !res.userId || !res.verificationType) {
        setError(res.error || 'No account found for this email address.')
        setLoading(false)
        return
      }

      setUserId(res.userId)
      setVerificationType(res.verificationType)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'An error occurred during account lookup.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Confirm Verification (Last 4 digits of phone or School Code)
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationInput) {
      setError(
        verificationType === 'PHONE'
          ? 'Please enter the last 4 digits of your phone number.'
          : 'Please enter your school code.'
      )
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await confirmForgotPasswordVerificationAction(userId, verificationType, verificationInput)
      if (!res.success) {
        setError(res.error || 'Verification failed. Please check your input and try again.')
        setLoading(false)
        return
      }

      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters in length.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await resetForgotPasswordPasswordAction(userId, newPassword)
      if (!res.success) {
        setError(res.error || 'Failed to update password.')
        setLoading(false)
        return
      }

      setStep(4)
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
            <KeyRound className="w-4 h-4" />
            <span>PASSWORD RECOVERY</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Retrieve Access</h1>
          <p className="text-sm font-medium text-slate-400">
            {step === 1 && 'Enter your registered email address to locate your account.'}
            {step === 2 &&
              (verificationType === 'PHONE'
                ? 'Enter the last 4 digits of your registered phone number.'
                : 'Enter your official School Code to verify student identity.')}
            {step === 3 && 'Choose a new strong password for your account.'}
            {step === 4 && 'Your password has been updated in real time.'}
          </p>
        </div>

        {/* Card Form with Glassy UI */}
        <Card className="border border-white/20 bg-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />
          <CardContent className="p-8 space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold leading-relaxed flex items-center gap-3">
                <Shield className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: EMAIL LOOKUP */}
            {step === 1 && (
              <form onSubmit={handleVerifyEmail} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Registered Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. user@academy.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 pl-11 rounded-2xl h-12 text-sm focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl font-black tracking-wide text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>LOOKING UP...</span>
                    </>
                  ) : (
                    <>
                      <span>CONTINUE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* STEP 2: SECURITY VERIFICATION */}
            {step === 2 && (
              <form onSubmit={handleConfirmVerification} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="verification" className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {verificationType === 'PHONE' ? 'Last 4 Digits of Mobile Number' : 'Academy School Code'}
                  </Label>
                  <div className="relative">
                    {verificationType === 'PHONE' ? (
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    ) : (
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    )}
                    <Input
                      id="verification"
                      type={verificationType === 'PHONE' ? 'text' : 'text'}
                      maxLength={verificationType === 'PHONE' ? 4 : 20}
                      placeholder={verificationType === 'PHONE' ? 'e.g. 4279' : 'e.g. EXCE-10015'}
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value)}
                      required
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 pl-11 rounded-2xl h-12 text-sm focus:border-blue-500 font-medium tracking-widest"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl font-black tracking-wide text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>VERIFYING...</span>
                    </>
                  ) : (
                    <>
                      <span>VERIFY IDENTITY</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-black uppercase tracking-wider text-slate-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 pl-11 rounded-2xl h-12 text-sm focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 pl-11 rounded-2xl h-12 text-sm focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 rounded-2xl font-black tracking-wide text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>UPDATING PASSWORD...</span>
                    </>
                  ) : (
                    <>
                      <span>UPDATE PASSWORD</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {step === 4 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">Password Changed Successfully!</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">
                    Your password has been updated in real time in the Supabase database. You may now sign in with your new password.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl font-black tracking-wide text-sm shadow-xl shadow-blue-600/20 transition-all"
                >
                  PROCEED TO SIGN IN
                </Button>
              </div>
            )}

            {/* Back to Sign In Link */}
            {step < 4 && (
              <div className="pt-2 text-center">
                <Link
                  href="/auth/signin"
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs font-bold text-slate-500">
          <p>© 2026 EL LEARNERS APP. Made with 💕 by E. V. E</p>
        </div>
      </div>
    </div>
  )
}
