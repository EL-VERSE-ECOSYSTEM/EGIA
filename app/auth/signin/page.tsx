'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Mail, Lock, Loader2, ArrowRight, GraduationCap, Eye, EyeOff, Crown, UserCheck } from 'lucide-react'
import { signInAction, activateIdentityAction } from './actions'
import { RolePickerModal } from '@/components/auth/RolePickerModal'
import { LoginContext, UserIdentity } from '@/lib/auth/resolveIdentities'
import { toast } from 'sonner'

export default function SignInPage() {
  const router = useRouter()
  const [loginMode, setLoginMode] = useState<'standard' | 'superadmin'>('standard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Multi-identity resolution modal state
  const [loginContext, setLoginContext] = useState<LoginContext | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleModeSwitch = (mode: 'standard' | 'superadmin') => {
    setLoginMode(mode)
    setError('')
    setEmail('')
    setPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetEmail = email.trim()
    const targetPassword = password

    if (!targetEmail || !targetPassword) {
      setError('Please provide both your account identifier and password.')
      return
    }

    const isSuperAdminTarget = targetEmail.toLowerCase() === 'ixoralyon013@gmail.com'

    if (loginMode === 'superadmin' && !isSuperAdminTarget) {
      setError('Super Admin portal access is strictly restricted to the authorized Super Admin account (ixoralyon013@gmail.com).')
      return
    }

    if (loginMode === 'standard' && isSuperAdminTarget) {
      setError('Super Admin account must authenticate via the Super Admin login tab. Please switch tabs to sign in.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await signInAction(targetEmail, targetPassword, loginMode)

      if (!res.success || !res.context) {
        setError(res.error || 'Authentication failed. Please verify your credentials.')
        setLoading(false)
        return
      }

      const { identities, lastIdentityId, email: resolvedUserEmail } = res.context
      const isSuperAdminAccount = (resolvedUserEmail || targetEmail).toLowerCase() === 'ixoralyon013@gmail.com'

      // If Super Admin email was authenticated, direct immediately to Super Admin Dashboard
      if (isSuperAdminAccount) {
        const superAdminIdent = identities.find((i) => i.role === 'SUPER_ADMIN') || identities[0]
        if (superAdminIdent) {
          const activateRes = await activateIdentityAction(superAdminIdent.id, rememberMe)
          toast.success('Welcome Super Admin! Direct access granted.')
          window.location.href = (activateRes.success && activateRes.redirectTo)
            ? activateRes.redirectTo
            : '/dashboard/super-admin/overview'
          return
        }
      }

      // Scenario A: Single identity -> Instant direct navigation without modal
      if (identities.length === 1) {
        const singleIdentity = identities[0]
        const activateRes = await activateIdentityAction(singleIdentity.id, rememberMe)
        if (activateRes.success && activateRes.redirectTo) {
          toast.success('Welcome back to EL LEARNERS APP')
          window.location.href = activateRes.redirectTo
          return
        } else {
          setError(activateRes.error || 'Unable to activate your account identity.')
          setLoading(false)
          return
        }
      }

      // Scenario B: Remembered identity match -> Instant navigation if lastIdentityId is stored
      if (rememberMe && lastIdentityId) {
        const rememberedIdentity = identities.find((i) => i.id === lastIdentityId)
        if (rememberedIdentity) {
          const activateRes = await activateIdentityAction(rememberedIdentity.id, true)
          if (activateRes.success && activateRes.redirectTo) {
            toast.success('Welcome back to EL LEARNERS APP')
            router.push(activateRes.redirectTo)
            return
          } else {
            setError(activateRes.error || 'Unable to activate your saved identity.')
            setLoading(false)
            return
          }
        }
      }

      // Scenario C: Multiple identities -> Open RolePickerModal
      setLoginContext(res.context)
      setIsModalOpen(true)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
      setLoading(false)
    }
  }

  const handleSelectIdentity = async (identity: UserIdentity, remember: boolean) => {
    setLoading(true)
    try {
      const res = await activateIdentityAction(identity.id, remember)
      if (res.success && res.redirectTo) {
        toast.success('Welcome back to EL LEARNERS APP')
        setIsModalOpen(false)
        router.push(res.redirectTo)
      } else {
        setError(res.error || 'Failed to activate selected identity.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while activating your identity.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/80 to-purple-950/80 animate-gradient-x text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none animate-pulse" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
            <GraduationCap className="w-4 h-4" />
            <span>EL LEARNERS APP</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            {loginMode === 'superadmin' ? 'Super Admin Portal' : 'Welcome Back'}
          </h1>
          <p className="text-xs font-bold text-slate-300">
            {loginMode === 'superadmin'
              ? 'Secure easy login for Global Platform Administrators.'
              : 'Sign in using Email Address, Staff ID (Teacher), or Admission Number (Student).'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => handleModeSwitch('standard')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              loginMode === 'standard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Standard Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('superadmin')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              loginMode === 'superadmin'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-400/30'
                : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Super Admin</span>
          </button>
        </div>

        {/* Card Form */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            {error && (
              <div role="alert" aria-live="polite" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold leading-relaxed flex items-center gap-3">
                <Shield className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loginMode === 'superadmin' && (
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-xs font-bold text-purple-300 flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Super Admin Mode Active: Authenticate with password to access system controls.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {loginMode === 'superadmin' ? 'Super Admin Email' : 'Email, Staff ID, or Admission Number'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    id="email"
                    type="text"
                    autoComplete="username"
                    inputMode="email"
                    placeholder={
                      loginMode === 'superadmin'
                        ? 'Super admin email address'
                        : 'Enter your email, staff ID, or admission number'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-describedby="email-hint"
                    className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 pl-11 rounded-2xl h-12 text-xs focus:border-blue-500 font-bold"
                  />
                </div>
                <p id="email-hint" className="text-[11px] font-bold text-slate-400 pl-1">
                  {loginMode === 'superadmin'
                    ? 'Enter your designated Super Admin email account.'
                    : 'Use your registered school email address, staff code, or admission number.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 pl-11 pr-11 rounded-2xl h-12 text-sm focus:border-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="remember" className="text-xs font-bold text-slate-400 cursor-pointer select-none">
                  Use this portal automatically next time
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full text-white h-12 rounded-2xl font-black tracking-wide text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                  loginMode === 'superadmin'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>{loginMode === 'superadmin' ? 'SUPER ADMIN SIGN IN' : 'SIGN IN'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Registration Navigation Links */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3 text-center">
              <p className="text-xs font-medium text-slate-400">
                Don't have a User Account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-bold text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-4"
                >
                  Create User Account
                </Link>
              </p>
              <p className="text-xs font-medium text-slate-400">
                Don't have a School Account?{' '}
                <Link
                  href="/school-registration"
                  className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4"
                >
                  Create School Account
                </Link>
              </p>
              <div className="flex justify-center gap-4 text-[11px] font-semibold text-slate-500 pt-1">
                <Link href="/terms" className="hover:text-slate-300 transition-colors">
                  Terms & Conditions
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-xs font-bold text-slate-500">
          <p>© 2026 EL LEARNERS APP. Made with 💕 by E. V. E</p>
        </div>
      </div>

      {/* Role Picker Modal for multi-identity accounts */}
      {loginContext && (
        <RolePickerModal
          isOpen={isModalOpen}
          context={loginContext}
          onSelectIdentity={handleSelectIdentity}
        />
      )}
    </div>
  )
}
