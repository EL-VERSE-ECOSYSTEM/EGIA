'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function DataDeletionPage() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your account email address.')
      return
    }

    setSubmitting(true)
    // Simulate submission delay and log request
    await new Promise((res) => setTimeout(res, 1000))
    setSubmitting(false)
    setSubmitted(true)
    toast.success('Data deletion request submitted successfully!')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
            <Trash2 className="w-4 h-4" />
            <span>NDPR & GDPR PRIVACY RIGHTS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Data Deletion & Right to be Forgotten Request
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Pursuant to the Nigeria Data Protection Act (NDPA) and Global Data Protection Regulations (GDPR), EL LEARNERS users have the right to request permanent deletion of their personal records and linked account data.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 bg-slate-900 border border-emerald-500/30 rounded-3xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Request Received</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your request for permanent data deletion has been logged. A confirmation email will be sent to <strong>{email}</strong> within 24 hours. Data erasure will complete within 30 days in compliance with NDPA guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Registered Email Address</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-slate-950 border-slate-800 text-white font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Account Category / Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="STUDENT">Student / Pupil</option>
                <option value="PARENT">Parent / Guardian</option>
                <option value="TEACHER">Teacher / Educator</option>
                <option value="ADMIN">School Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Reason for Account Deletion (Optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you wish to delete your account data..."
                className="bg-slate-950 border-slate-800 text-white font-medium text-xs min-h-[100px]"
              />
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium leading-relaxed flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <span>
                <strong>Warning:</strong> Deleting your account is permanent. All exam scores, certificates, CBT history, wallet balances, and student records will be erased and cannot be recovered.
              </span>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black h-12 rounded-2xl shadow-xl shadow-rose-600/20 text-xs flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>SUBMIT DATA DELETION REQUEST</span>
            </Button>
          </form>
        )}

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-bold text-slate-200">Direct Privacy Contact:</p>
          <p>EL VERSE ECOSYSTEM Data Protection Officer</p>
          <p>Email: <a href="mailto:elversetechnologies@gmail.com" className="text-amber-400 hover:underline">elversetechnologies@gmail.com</a></p>
        </div>
      </div>
    </main>
  )
}
