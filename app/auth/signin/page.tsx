'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { loginRole, loginStudent } from '@/app/actions/auth-server'
import { getSchoolByCodeAction } from '@/app/actions/school'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | 'PARENT' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN'>('SCHOOL_ADMIN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleThemes = {
    SUPER_ADMIN: {
      bg: 'from-purple-950 to-slate-900',
      accent: 'bg-[#7C3AED] text-white',
      hoverAccent: 'hover:bg-purple-700',
      focusRing: 'focus:ring-purple-600',
      shadow: 'shadow-purple-600/20',
      line: 'bg-[#7C3AED]',
      text: 'text-purple-400'
    },
    SCHOOL_ADMIN: {
      bg: 'from-slate-950 via-blue-950 to-slate-900',
      accent: 'bg-[#1E3A8A] text-white',
      hoverAccent: 'hover:bg-blue-800',
      focusRing: 'focus:ring-blue-800',
      shadow: 'shadow-blue-900/20',
      line: 'bg-[#1E3A8A]',
      text: 'text-blue-400'
    },
    TEACHER: {
      bg: 'from-teal-950 to-slate-900',
      accent: 'bg-[#0D9488] text-white',
      hoverAccent: 'hover:bg-teal-700',
      focusRing: 'focus:ring-teal-600',
      shadow: 'shadow-teal-600/20',
      line: 'bg-[#0D9488]',
      text: 'text-teal-400'
    },
    STUDENT: {
      bg: 'from-orange-950 to-slate-900',
      accent: 'bg-[#F97316] text-white',
      hoverAccent: 'hover:bg-orange-600',
      focusRing: 'focus:ring-orange-500',
      shadow: 'shadow-orange-500/20',
      line: 'bg-[#F97316]',
      text: 'text-orange-400'
    },
    PARENT: {
      bg: 'from-indigo-950 to-slate-900',
      accent: 'bg-[#4F46E5] text-white',
      hoverAccent: 'hover:bg-indigo-700',
      focusRing: 'focus:ring-indigo-600',
      shadow: 'shadow-indigo-600/20',
      line: 'bg-[#4F46E5]',
      text: 'text-indigo-400'
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
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} flex flex-col items-center justify-center p-4 transition-all duration-700`}>
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/15">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-white uppercase">EL <span className={currentTheme.text}>LEARNERS APP</span></span>
      </div>

      <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-950 text-white transform transition-all duration-500 hover:scale-[1.01]">
        <div className={`h-2.5 ${currentTheme.line} w-full transition-all duration-700`} />
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-black text-white tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400 font-bold mt-2">
            Sign in to access your role-tailored dashboard on EL LEARNERS APP
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
              <Label htmlFor="role" className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Login As</Label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className={`w-full h-12 rounded-xl border border-slate-800 bg-slate-900 px-4 font-bold text-white focus:ring-2 ${currentTheme.focusRing} focus:outline-none transition-all duration-300`}
              >
                <option value="SCHOOL_ADMIN">School Admin (Deep Navy)</option>
                <option value="SUPER_ADMIN">Super Admin (Royal Purple)</option>
                <option value="TEACHER">Teacher (Teal)</option>
                <option value="STUDENT">Student / Pupil (Vibrant Orange)</option>
                <option value="PARENT">Parent (Soft Indigo)</option>
              </select>
            </div>

            {selectedRole === 'SCHOOL_ADMIN' && (
              <div className="space-y-2">
                <Label htmlFor="schoolCode" className="text-xs font-black uppercase text-blue-400 tracking-wider ml-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> School Registration Code *
                </Label>
                <Input
                  id="schoolCode"
                  type="text"
                  placeholder="e.g. EXCE-12345"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  required
                  className={`h-12 rounded-xl border-slate-800 bg-slate-900 text-white font-mono uppercase focus:ring-2 ${currentTheme.focusRing} transition-all duration-300`}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">
                {selectedRole === 'STUDENT' ? 'Admission Number' : selectedRole === 'TEACHER' ? 'Staff ID or Email' : 'Email Address'}
              </Label>
              <Input
                id="email"
                type="text"
                placeholder={selectedRole === 'STUDENT' ? 'e.g. EXCE-S-12345' : selectedRole === 'TEACHER' ? 'e.g. EXCE-ST-00123' : 'admin@school.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`h-12 rounded-xl border-slate-800 bg-slate-900 text-white focus:ring-2 ${currentTheme.focusRing} transition-all duration-300`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-black uppercase text-slate-400 tracking-wider">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`h-12 rounded-xl border-slate-800 bg-slate-900 text-white focus:ring-2 ${currentTheme.focusRing} transition-all duration-300`}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full ${currentTheme.accent} ${currentTheme.hoverAccent} h-14 rounded-2xl font-black text-lg shadow-xl ${currentTheme.shadow} mt-4 transition-all duration-300 transform active:scale-95`}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs font-bold text-slate-400 space-y-2">
            <div>
              New School? <Link href="/school-registration" className="text-blue-400 hover:underline font-black">Register School Now</Link>
            </div>
            <div>
              User Registration? <Link href="/auth/signup" className="text-teal-400 hover:underline font-black">Create User Account</Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">
        EL LEARNERS APP • Role Design Standardized
      </p>
    </div>
  )
}
