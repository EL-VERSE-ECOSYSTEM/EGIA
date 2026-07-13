'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Loader2, AlertCircle, GraduationCap } from 'lucide-react'
import { registerParent } from '@/app/actions/auth-server'

export default function ParentSignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      alert('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = await registerParent(formData)

      if (result.error) {
        setError(result.error)
        alert(result.error)
        setLoading(false)
      } else {
        router.push('/auth/verify-email')
      }
    } catch (err) {
      setError('Account failed to create')
      alert('Account failed to create')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 py-16">
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-emerald-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-emerald-600">ACADEMY</span></span>
      </div>

      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 bg-emerald-600 w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-emerald-100 p-4 rounded-2xl w-fit mb-4">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Parent Registration</CardTitle>
          <CardDescription className="text-slate-500 font-bold mt-2">
            Monitor your child's progress and stay updated
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  required
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234..."
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" title="confirm-password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-emerald-600"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 mt-6 transition-all"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Account'}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm font-bold text-slate-400">
            Already have an account? <Link href="/auth/signin" className="text-emerald-600 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </CardContent>
      </Card>

      <p className="mt-10 text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
        built by ELCODERS by E.V.E
      </p>
    </div>
  )
}
