'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'
import { loginRole, loginStudent, checkStudentPasswordRequirement } from '@/app/actions/auth-server'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN'>('PARENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentRequiresPassword, setStudentRequiresPassword] = useState(false)

  React.useEffect(() => {
    if (selectedRole === 'STUDENT' && email.trim().length >= 4) {
      const check = async () => {
        try {
          const req = await checkStudentPasswordRequirement(email.trim())
          setStudentRequiresPassword(req.requiresPassword)
        } catch {
          setStudentRequiresPassword(false)
        }
      }
      check()
    } else {
      setStudentRequiresPassword(false)
    }
  }, [email, selectedRole])

  const roleThemes = {
    PARENT: {
      bg: 'from-emerald-950 to-slate-900',
      accent: 'bg-emerald-600 text-white',
      hoverAccent: 'hover:bg-emerald-700',
      focusRing: 'focus:ring-emerald-600',
      shadow: 'shadow-emerald-600/10',
      line: 'bg-emerald-600',
      text: 'text-emerald-400'
    },
    STUDENT: {
      bg: 'from-orange-950 to-slate-900',
      accent: 'bg-orange-600 text-white',
      hoverAccent: 'hover:bg-orange-700',
      focusRing: 'focus:ring-orange-600',
      shadow: 'shadow-orange-600/10',
      line: 'bg-orange-600',
      text: 'text-orange-400'
    },
    TEACHER: {
      bg: 'from-purple-950 to-slate-900',
      accent: 'bg-purple-600 text-white',
      hoverAccent: 'hover:bg-purple-700',
      focusRing: 'focus:ring-purple-600',
      shadow: 'shadow-purple-600/10',
      line: 'bg-purple-600',
      text: 'text-purple-400'
    },
    ADMIN: {
      bg: 'from-amber-950 to-slate-900',
      accent: 'bg-amber-600 text-white',
      hoverAccent: 'hover:bg-amber-700',
      focusRing: 'focus:ring-amber-600',
      shadow: 'shadow-amber-600/10',
      line: 'bg-amber-600',
      text: 'text-amber-400'
    }
  }

  const currentTheme = roleThemes[selectedRole]
  const requiresPassword = true // Always show password field for all roles to prevent hidden-field timing bugs and ensure standard login UX

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (selectedRole === 'STUDENT') {
      try {
        const result = await loginStudent({
          admissionNumber: email.toUpperCase().trim(),
          password: requiresPassword ? password : undefined
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
        setError('Student admission number login failed. Please contact support.')
        setLoading(false)
        return
      }
    }

    try {
      const result = await loginRole({
        identifier: email,
        password,
        role: selectedRole,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setLoading(false)
      window.location.href = '/dashboard-redirect'
    } catch (err) {
      console.warn('Supabase authentication failed.', err)
      setError('Connection error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} flex flex-col items-center justify-center p-4 transition-all duration-700`}>
      <div className="mb-8 flex items-center gap-2 animate-bounce">
        <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/15">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-white uppercase">EL GOODNEWS <span className={currentTheme.text}>ACADEMY</span></span>
      </div>

      <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white text-slate-900 transform transition-all duration-500 hover:scale-[1.01]">
        <div className={`h-2.5 ${currentTheme.line} w-full transition-all duration-700`} />
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-slate-400 font-bold mt-2">
            Sign in to access your secure {selectedRole.toLowerCase()} dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex items-center gap-3 animate-in shake duration-300">
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
                className={`w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-800 focus:bg-white focus:ring-2 ${currentTheme.focusRing} focus:outline-none transition-all duration-300`}
              >
                <option value="PARENT">Parent</option>
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">
                {selectedRole === 'STUDENT' ? 'Admission Number' : selectedRole === 'TEACHER' ? 'Staff ID or Email' : 'Email Address'}
              </Label>
              <Input
                id="email"
                type="text"
                placeholder={selectedRole === 'STUDENT' ? 'e.g. EGIA-S-00998' : selectedRole === 'TEACHER' ? 'e.g. EGIA-ST-00123' : 'name@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 ${currentTheme.focusRing} transition-all duration-300`}
              />
            </div>
            {requiresPassword && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" title="password" className="text-xs font-black uppercase text-slate-400 tracking-wider">Password</Label>
                  <Link href="/auth/forgot-password" title="forgot-password" className={`text-xs font-bold ${currentTheme.text.replace('text-', 'text-')} hover:underline`}>Forgot password?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={requiresPassword}
                  className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 ${currentTheme.focusRing} transition-all duration-300`}
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full ${currentTheme.accent} ${currentTheme.hoverAccent} h-14 rounded-2xl font-black text-lg shadow-xl ${currentTheme.shadow} mt-4 transition-all duration-300 transform active:scale-95`}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-bold text-slate-400">
            Don't have an account?
            <Link href="/auth/signup" className={`font-black hover:underline ml-1 ${currentTheme.text.replace('text-', 'text-')}`}>Register Now</Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-10 text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
        built by ELCODERS by E.V.E
      </p>
    </div>
  )
}
