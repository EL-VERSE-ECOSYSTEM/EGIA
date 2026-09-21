'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Mail, Lock, Loader2, ArrowRight, CheckCircle2, GraduationCap, Eye, EyeOff } from 'lucide-react'
import { signInAction, activateIdentityAction } from './actions'
import { RolePickerModal } from '@/components/auth/RolePickerModal'
import { LoginContext, UserIdentity } from '@/lib/auth/resolveIdentities'
import { toast } from 'sonner'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Multi-identity resolution modal state
  const [loginContext, setLoginContext] = useState<LoginContext | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both your email address and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await signInAction(email, password)

      if (!res.success || !res.context) {
        setError(res.error || 'Authentication failed. Please verify your credentials.')
        setLoading(false)
        return
      }

      const { identities, lastIdentityId } = res.context

      // Scenario A: Single identity -> Instant direct navigation without modal
      if (identities.length === 1) {
        const singleIdentity = identities[0]
        const activateRes = await activateIdentityAction(singleIdentity.id, rememberMe)
        if (activateRes.success && activateRes.redirectTo) {
          toast.success('Welcome back to EL LEARNERS APP')
          router.push(activateRes.redirectTo)
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
          <h1 className="text-3xl font-black tracking-tight">Welcome Back</h1>
          <p className="text-xs font-bold text-slate-300">
            Sign in using Email Address, Staff ID (Teacher), or Admission Number (Student).
          </p>
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Email, Staff ID, or Admission Number
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    id="email"
                    type="text"
                    autoComplete="username"
                    inputMode="email"
                    placeholder="Enter your email, staff ID, or admission number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-describedby="email-hint"
                    className="bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 pl-11 rounded-2xl h-12 text-xs focus:border-blue-500 font-bold"
                  />
                </div>
                <p id="email-hint" className="text-[11px] font-bold text-slate-400 pl-1">
                  Use your registered school email address, staff code, or admission number.
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-2xl font-black tracking-wide text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN</span>
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
