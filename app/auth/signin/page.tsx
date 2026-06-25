'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard-redirect')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-amber-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-amber-600">ACADEMY</span></span>
      </div>

      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-3xl overflow-hidden">
        <div className="h-2 bg-amber-600 w-full" />
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-black text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="text-slate-500 font-medium mt-2">
            Sign in to access your academy dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-bold ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-amber-600 transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="password" className="text-slate-700 font-bold">Password</Label>
                <Link href="/auth/forgot-password" title="forgot-password" className="text-xs font-bold text-amber-600 hover:underline">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-amber-600 transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 mt-4"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account?
            <Link href="/auth/signup/parent" className="text-amber-600 font-black hover:underline ml-1">Register Now</Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-widest">
        built by ELCODERS by E.V.E
      </p>
    </div>
  )
}
