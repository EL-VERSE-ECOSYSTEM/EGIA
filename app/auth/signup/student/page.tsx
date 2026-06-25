'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, AlertCircle, Laptop } from 'lucide-react'
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
      <div className="mb-10 flex items-center gap-2">
        <div className="bg-orange-600 p-2 rounded-lg">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-orange-600">ACADEMY</span></span>
      </div>

      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="h-2 bg-orange-600 w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-orange-100 p-4 rounded-2xl w-fit mb-4">
            <Laptop className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Student Activation</CardTitle>
          <CardDescription className="text-slate-500 font-bold mt-2">
            Enter your admission number to portal access
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
            <div className="space-y-2">
              <Label htmlFor="admissionNumber" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admission Number</Label>
              <Input
                id="admissionNumber"
                placeholder="GODXXXXX"
                value={formData.admissionNumber}
                onChange={e => setFormData({...formData, admissionNumber: e.target.value.toUpperCase()})}
                required
                className="h-12 rounded-xl border-slate-200 bg-orange-50/50 uppercase font-black focus:bg-white focus:ring-orange-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Portal Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200 focus:ring-orange-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Set Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
                className="h-12 rounded-xl border-slate-200 focus:ring-orange-600"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-14 rounded-2xl font-black text-lg shadow-xl shadow-orange-200 mt-6"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Activate Portal'}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm font-bold text-slate-400">
            Already activated? <Link href="/auth/signin" className="text-orange-600 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
