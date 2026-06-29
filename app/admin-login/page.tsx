'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldAlert, Loader2, AlertCircle } from 'lucide-react'
import { loginAdmin } from '@/app/actions/auth-server'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await loginAdmin({ email, password })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard-redirect')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-amber-500 p-2 rounded-lg">
          <ShieldAlert className="text-slate-950 w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-white uppercase">EGIA <span className="text-amber-500">Administrator</span> Portal</span>
      </div>

      <Card className="max-w-md w-full border-slate-800 bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border">
        <div className="h-2 bg-amber-500 w-full" />
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-black text-white">System Access</CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-2">
            Enter administrative credentials to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-950/50 border border-red-500/50 text-red-200 text-sm font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-bold ml-1">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@egia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-2xl border-slate-700 bg-slate-800 text-white focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-slate-300 font-bold ml-1">Security Key</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-2xl border-slate-700 bg-slate-800 text-white focus:ring-amber-500 transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 h-14 rounded-2xl font-black text-lg shadow-xl shadow-amber-500/10 mt-4"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'AUTHORIZE'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-slate-600 font-bold uppercase tracking-widest">
        Level 4 Authorization Required
      </p>
    </div>
  )
}
