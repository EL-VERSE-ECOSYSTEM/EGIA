'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Building2, Sparkles, ShieldCheck, Lock } from 'lucide-react'
import { loginRole, loginStudent } from '@/app/actions/auth-server'
import { getSchoolByCodeAction } from '@/app/actions/school'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [adminLevel, setAdminLevel] = useState<'PRIMARY_ADMIN' | 'VICE_PRINCIPAL_ACADEMICS' | 'VICE_PRINCIPAL_ADMIN' | 'HOD_SCIENCE' | 'HOD_ARTS' | 'HOD_COMMERCIAL'>('PRIMARY_ADMIN')
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | 'PARENT' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN'>('SCHOOL_ADMIN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 3D Tilt calculation state
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.getBoundingClientRect()
    const cardX = e.clientX - card.left - card.width / 2
    const cardY = e.clientY - card.top - card.height / 2
    setRotateX(-cardY / 30)
    setRotateY(cardX / 30)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  const roleThemes = {
    SUPER_ADMIN: {
      bg: 'from-purple-950 via-slate-900 to-purple-900',
      accent: 'bg-[#7C3AED] text-white',
      hoverAccent: 'hover:bg-purple-700',
      focusRing: 'focus:ring-purple-600',
      shadow: 'shadow-[0_20px_50px_rgba(124,58,237,0.3)]',
      glow: 'from-purple-500/20 to-indigo-500/0',
      line: 'bg-[#7C3AED]',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    SCHOOL_ADMIN: {
      bg: 'from-slate-950 via-blue-950 to-slate-900',
      accent: 'bg-[#1E3A8A] text-white',
      hoverAccent: 'hover:bg-blue-800',
      focusRing: 'focus:ring-blue-800',
      shadow: 'shadow-[0_20px_50px_rgba(30,58,138,0.3)]',
      glow: 'from-blue-500/20 to-sky-500/0',
      line: 'bg-[#1E3A8A]',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    TEACHER: {
      bg: 'from-teal-950 via-slate-900 to-teal-900',
      accent: 'bg-[#0D9488] text-white',
      hoverAccent: 'hover:bg-teal-700',
      focusRing: 'focus:ring-teal-600',
      shadow: 'shadow-[0_20px_50px_rgba(13,148,136,0.3)]',
      glow: 'from-teal-500/20 to-emerald-500/0',
      line: 'bg-[#0D9488]',
      text: 'text-teal-400',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    },
    STUDENT: {
      bg: 'from-orange-950 via-slate-900 to-orange-900',
      accent: 'bg-[#F97316] text-white',
      hoverAccent: 'hover:bg-orange-600',
      focusRing: 'focus:ring-orange-500',
      shadow: 'shadow-[0_20px_50px_rgba(249,115,22,0.3)]',
      glow: 'from-orange-500/20 to-amber-500/0',
      line: 'bg-[#F97316]',
      text: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    },
    PARENT: {
      bg: 'from-indigo-950 via-slate-900 to-indigo-900',
      accent: 'bg-[#4F46E5] text-white',
      hoverAccent: 'hover:bg-indigo-700',
      focusRing: 'focus:ring-indigo-600',
      shadow: 'shadow-[0_20px_50px_rgba(79,70,229,0.3)]',
      glow: 'from-indigo-500/20 to-purple-500/0',
      line: 'bg-[#4F46E5]',
      text: 'text-indigo-400',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    }
  }

  const currentTheme = roleThemes[selectedRole]

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (selectedRole === 'SCHOOL_ADMIN') {
      if (!schoolCode) {
        setError('School Registration Code is required.')
        setLoading(false)
        return
      }

      const schoolCheck = await getSchoolByCodeAction(schoolCode)
      if (!schoolCheck.success) {
        setError('Invalid School Registration Code.')
        setLoading(false)
        return
      }

      const result = await loginRole({
        identifier: email,
        password,
        role: 'ADMIN' as any,
        adminLevel: adminLevel,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setLoading(false)
      window.location.href = '/dashboard/admin/overview'
      return
    }

    if (selectedRole === 'SUPER_ADMIN') {
      const result = await loginRole({
        identifier: email,
        password,
        role: 'ADMIN' as any,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setLoading(false)
      window.location.href = '/dashboard/super-admin/overview'
      return
    }

    if (selectedRole === 'STUDENT') {
      try {
        const result = await loginStudent({
          admissionNumber: email.toUpperCase().trim(),
          password
        })
        if (result.error) {
          setError(result.error)
          setLoading(false)
          return
        }

        setLoading(false)
        window.location.href = '/dashboard-redirect'
        return
      } catch (err) {
        console.error('Student login failed:', err)
        setError('Student login failed. Please contact support.')
        setLoading(false)
        return
      }
    }

    try {
      const result = await loginRole({
        identifier: email,
        password,
        role: selectedRole as any,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setLoading(false)
      window.location.href = '/dashboard-redirect'
    } catch (err) {
      console.warn('Authentication failed.', err)
      setError('Connection error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-700 relative overflow-hidden perspective-[1200px]`}>
      {/* Background Floating 3D Lights */}
      <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br ${currentTheme.glow} blur-3xl opacity-50 animate-pulse pointer-events-none`} />
      <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br ${currentTheme.glow} blur-3xl opacity-50 animate-pulse pointer-events-none`} />

      {/* Header Logo Badge */}
      <div className="mb-8 flex items-center gap-3 relative z-10">
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transform transition hover:scale-110 hover:rotate-6">
          <GraduationCap className="text-white w-7 h-7" />
        </div>
        <div>
          <span className="font-black text-2xl tracking-tight text-white uppercase">
            EL <span className={currentTheme.text}>LEARNERS APP</span>
          </span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3D Dynamic Auth Gateway</p>
        </div>
      </div>

      {/* 3D Elevated Card Container */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out'
        }}
        className="max-w-md w-full relative z-10"
      >
        <Card className={`border border-white/10 ${currentTheme.shadow} rounded-[2.5rem] overflow-hidden bg-slate-950/90 backdrop-blur-2xl text-white transform-gpu transition-all duration-300 border-t border-l border-white/20`}>
          <div className={`h-2.5 ${currentTheme.line} w-full transition-all duration-700`} />

          <CardHeader className="text-center pt-8 pb-4 space-y-2">
            <div className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-widest mb-1 ${currentTheme.badge}">
              <Sparkles className="w-3.5 h-3.5" /> Secure Portal Access
            </div>
            <CardTitle className="text-3xl font-black text-white tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400 font-bold text-xs max-w-xs mx-auto">
              Sign in to access your role-tailored dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSignIn} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role" className="text-[11px] font-black uppercase text-slate-400 tracking-wider ml-1">Login As</Label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className={`w-full h-12 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 font-bold text-xs text-white focus:ring-2 ${currentTheme.focusRing} focus:outline-none transition-all duration-300 shadow-inner`}
                >
                  <option value="SCHOOL_ADMIN">School Admin (Deep Navy)</option>
                  <option value="SUPER_ADMIN">Super Admin (Royal Purple)</option>
                  <option value="TEACHER">Teacher (Teal)</option>
                  <option value="STUDENT">Student / Pupil (Vibrant Orange)</option>
                  <option value="PARENT">Parent (Soft Indigo)</option>
                </select>
              </div>

              {selectedRole === 'SCHOOL_ADMIN' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode" className="text-[11px] font-black uppercase text-blue-400 tracking-wider ml-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> School Registration Code *
                    </Label>
                    <Input
                      id="schoolCode"
                      type="text"
                      placeholder="e.g. EXCE-12345"
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                      required
                      className={`h-12 rounded-2xl border-slate-800 bg-slate-900 text-white font-mono uppercase focus:ring-2 ${currentTheme.focusRing} transition-all duration-300 shadow-inner`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminLevel" className="text-[11px] font-black uppercase text-blue-400 tracking-wider ml-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> School Admin Role / Level *
                    </Label>
                    <select
                      id="adminLevel"
                      value={adminLevel}
                      onChange={(e) => setAdminLevel(e.target.value as any)}
                      className={`w-full h-12 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 font-bold text-xs text-white focus:ring-2 ${currentTheme.focusRing} focus:outline-none transition-all duration-300 shadow-inner`}
                    >
                      <option value="PRIMARY_ADMIN">Primary Admin (Full Control)</option>
                      <option value="VICE_PRINCIPAL_ACADEMICS">Vice Principal (Academics)</option>
                      <option value="VICE_PRINCIPAL_ADMIN">Vice Principal (Administration)</option>
                      <option value="HOD_SCIENCE">Head of Department (Science)</option>
                      <option value="HOD_ARTS">Head of Department (Arts)</option>
                      <option value="HOD_COMMERCIAL">Head of Department (Commercial)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-black uppercase text-slate-400 tracking-wider ml-1">
                  {selectedRole === 'STUDENT' ? 'Admission Number' : selectedRole === 'TEACHER' ? 'Staff ID or Email' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder={selectedRole === 'STUDENT' ? 'e.g. EXCE-S-12345' : selectedRole === 'TEACHER' ? 'e.g. EXCE-ST-00123' : 'admin@school.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`h-12 rounded-2xl border-slate-800 bg-slate-900 text-white focus:ring-2 ${currentTheme.focusRing} transition-all duration-300 shadow-inner`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`h-12 rounded-2xl border-slate-800 bg-slate-900 text-white focus:ring-2 ${currentTheme.focusRing} transition-all duration-300 shadow-inner`}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full ${currentTheme.accent} ${currentTheme.hoverAccent} h-14 rounded-2xl font-black text-base shadow-xl mt-4 transition-all duration-300 transform active:scale-95`}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'SIGN IN TO DASHBOARD'}
              </Button>
            </form>

            <div className="mt-8 text-center text-xs font-bold text-slate-400 space-y-2.5 pt-4 border-t border-slate-900">
              <div>
                New School Onboarding? <Link href="/school-registration" className="text-blue-400 hover:underline font-black">Register School Now</Link>
              </div>
              <div>
                Individual User Account? <Link href="/auth/signup" className="text-teal-400 hover:underline font-black">Create User Account</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] relative z-10">
        EL LEARNERS APP • Encrypted Role Architecture
      </p>
    </div>
  )
}
