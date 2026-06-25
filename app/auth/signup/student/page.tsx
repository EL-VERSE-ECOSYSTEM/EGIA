'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'
import { activateStudent } from '@/app/actions/auth-server'

export default function StudentSignUpPage() {
  const [formData, setFormData] = useState({
    admissionNumber: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await activateStudent(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/auth/verify-email')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-3xl overflow-hidden">
        <div className="h-2 bg-orange-600 w-full" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto bg-orange-100 p-4 rounded-2xl w-fit mb-4">
            <GraduationCap className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Student Activation</CardTitle>
          <CardDescription className="text-slate-500 font-medium mt-2">
            Activate your account using your Admission Number
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
            <div className="space-y-2">
              <Label htmlFor="admissionNumber" className="text-slate-700 font-bold">Admission Number</Label>
              <Input
                id="admissionNumber"
                placeholder="EGIA/2024/001"
                value={formData.admissionNumber}
                onChange={e => setFormData({...formData, admissionNumber: e.target.value})}
                required
                className="rounded-2xl border-slate-200 bg-orange-50/50 uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-bold">Preferred Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                className="rounded-2xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Set Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                className="rounded-2xl border-slate-200"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-orange-200 mt-4"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Activate My Account'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm font-medium text-slate-500">
            Need help? Contact school admin or <Link href="/auth/signin" className="text-orange-600 font-black hover:underline">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
