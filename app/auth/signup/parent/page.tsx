'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Loader2, AlertCircle } from 'lucide-react'
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
      return
    }

    setLoading(true)
    const result = await registerParent(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/auth/verify-email')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 py-12">
      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-3xl overflow-hidden">
        <div className="h-2 bg-emerald-600 w-full" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto bg-emerald-100 p-4 rounded-2xl w-fit mb-4">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Parent Registration</CardTitle>
          <CardDescription className="text-slate-500 font-medium mt-2">
            Create an account to monitor your children's progress
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="rounded-2xl border-slate-200 bg-slate-50/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  required
                  className="rounded-2xl border-slate-200 bg-slate-50/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                className="rounded-2xl border-slate-200 bg-slate-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234..."
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
                className="rounded-2xl border-slate-200 bg-slate-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                className="rounded-2xl border-slate-200 bg-slate-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                required
                className="rounded-2xl border-slate-200 bg-slate-50/50"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 mt-4"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Parent Account'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm font-medium text-slate-500">
            Already have an account? <Link href="/auth/signin" className="text-emerald-600 font-black hover:underline">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
