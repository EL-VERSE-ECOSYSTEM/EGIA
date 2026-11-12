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

    setLoading(true)
    setError('')

    try {
      const res = await signInAction(targetEmail, targetPassword, loginMode)

      if (!res.success || !res.context) {
        setError(res.error || 'Authentication failed. Please verify your credentials.')
        setLoading(false)
        return
      }

      const { identities, lastIdentityId } = res.context
      const superAdminIdentity = identities.find((i) => i.role === 'SUPER_ADMIN')

      // If Super Admin identity was authenticated, activate Super Admin identity & direct immediately to Super Admin Dashboard
      if (superAdminIdentity) {
        const superAdminActivateRes = await activateIdentityAction(superAdminIdentity.id, rememberMe)
        if (!superAdminActivateRes.success) {
          setError(superAdminActivateRes.error || 'Unable to activate your Super Admin identity.')
          setLoading(false)
          return
        }
        toast.success('Welcome Super Admin! Direct access granted.')
        window.location.href = superAdminActivateRes.redirectTo || res.redirectTo || '/dashboard/super-admin/overview'
        return
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during authentication.')
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while activating your identity.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950 px-4 py-10 text-white sm:px-6">
      {/* Background Decor */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
            <GraduationCap className="w-4 h-4" />
            <span>EL LEARNERS APP</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {loginMode === 'superadmin' ? 'Super Admin Portal' : 'Welcome Back'}
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-slate-300">
            {loginMode === 'superadmin'
              ? 'Secure easy login for Global Platform Administrators.'
              : 'Sign in using Email Address, Staff ID (Teacher), or Admission Number (Student).'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-700/80 bg-slate-900/80 p-1.5 shadow-lg shadow-black/10" role="group" aria-label="Choose sign-in portal">
          <button
            type="button"
            onClick={() => handleModeSwitch('standard')}
            aria-pressed={loginMode === 'standard'}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all ${
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
            aria-pressed={loginMode === 'superadmin'}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all ${
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
        <Card className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/90 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <CardContent className="space-y-6 p-5 sm:p-8">
            {error && (
              <div role="alert" aria-live="polite" className="flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                <Shield className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loginMode === 'superadmin' && (
              <div className="flex items-start gap-3 rounded-xl border border-purple-400/25 bg-purple-400/10 p-4 text-sm leading-6 text-purple-100">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Super Admin Mode Active: Authenticate with password to access system controls.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-100">
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
                    className="h-12 rounded-xl border-slate-700 bg-slate-950/70 pl-11 text-sm font-medium text-white placeholder:text-slate-500 focus-visible:ring-blue-400"
                  />
                </div>
                <p id="email-hint" className="pl-1 text-xs leading-5 text-slate-400">
                  {loginMode === 'superadmin'
                    ? 'Enter your registered Super Admin email account.'
                    : 'Use your registered school email address, staff code, or admission number.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-100">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-blue-300 underline-offset-4 hover:underline hover:text-blue-200"
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
                    className="h-12 rounded-xl border-slate-700 bg-slate-950/70 pl-11 pr-11 text-sm font-medium text-white placeholder:text-slate-500 focus-visible:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-slate-600 bg-slate-950 text-blue-500 focus:ring-blue-400"
                />
                <label htmlFor="remember" className="cursor-pointer select-none text-sm text-slate-300">
                  Use this portal automatically next time
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold tracking-wide text-white shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
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
            <div className="space-y-4 border-t border-slate-700/80 pt-5 text-center">
              <p className="text-sm text-slate-300">
                Don't have a User Account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200"
                >
                  Create User Account
                </Link>
              </p>
              <p className="text-sm text-slate-300">
                Don't have a School Account?{' '}
                <Link
                  href="/school-registration"
                  className="font-semibold text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
                >
                  Create School Account
                </Link>
              </p>
              <div className="flex justify-center gap-4 pt-1 text-xs font-medium text-slate-400">
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
        <div className="text-center text-xs text-slate-500">
          <p>© 2026 EL LEARNERS APP</p>
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
    </main>
  )
}
