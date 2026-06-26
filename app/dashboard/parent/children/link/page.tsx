'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UserPlus, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { linkChild } from '@/app/actions/user'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/dashboard-layout'

export default function LinkChildPage() {
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await linkChild(admissionNumber)
      if (result.success) {
        setSuccess(result.name)
        setAdmissionNumber('')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link child. Please check the admission number.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-2xl mx-auto space-y-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Link Your Child</h1>
          <p className="text-slate-500 font-medium text-lg text-pretty">Enter your child's admission number to connect their profile to your account.</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <div className="h-2 bg-emerald-600 w-full" />
          <CardHeader className="p-10">
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <UserPlus className="w-6 h-6 text-emerald-600" />
              </div>
              Student Lookup
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold">
              The admission number is formatted as GODXXXXX (e.g. GOD00001)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <form onSubmit={handleLink} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="admissionNumber" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admission Number</Label>
                <div className="flex gap-4">
                  <Input
                    id="admissionNumber"
                    placeholder="GODXXXXX"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                    required
                    className="h-16 rounded-2xl border-slate-200 bg-slate-50/50 uppercase font-black text-lg focus:bg-white focus:ring-emerald-600"
                  />
                  <Button type="submit" disabled={loading} className="h-16 w-20 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-xl">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-black text-red-900">Child not found</p>
                    <p className="text-red-600 text-sm font-medium mt-1">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="bg-white p-4 rounded-full shadow-lg shadow-emerald-200">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-900">Successfully Linked!</h3>
                    <p className="text-emerald-700 font-medium mt-2">
                      <span className="font-black underline">{success}</span> has been connected to your dashboard.
                    </p>
                  </div>
                  <div className="flex gap-4 w-full">
                    <Button asChild className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg shadow-emerald-100">
                      <Link href="/dashboard/parent/overview">Go to Dashboard</Link>
                    </Button>
                    <Button onClick={() => setSuccess(null)} variant="outline" className="flex-1 h-14 rounded-2xl border-2 border-emerald-100 font-black text-emerald-600">
                      Link Another
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
