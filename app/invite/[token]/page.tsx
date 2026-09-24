'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, CheckCircle2, AlertCircle, Sparkles, QrCode, Camera, X } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
import { QRCodeSVG } from '@/components/ui/qr-code'

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // QR Modal & Camera Scanner
  const [showQR, setShowQR] = useState(false)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Registration Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    async function loadInvite() {
      if (!token) return
      try {
        const res = await fetch(`/api/invitations/accept?token=${token}`)
        const data = await res.json()
        if (data.success) {
          setInvitation(data.invitation)
        } else {
          setError(data.error || 'Invalid or expired invitation token.')
        }
      } catch {
        setError('Failed to fetch invitation details.')
      } finally {
        setLoading(false)
      }
    }
    loadInvite()
  }, [token])

  const startScanner = async () => {
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      console.warn('Webcam camera access unavailable for QR scanner')
    }
  }

  const stopScanner = () => {
    setScanning(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !firstName || !lastName) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setError(data.error || 'Failed to accept invitation.')
      }
    } catch {
      setError('Network error processing invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  const fullInviteUrl = typeof window !== 'undefined' ? window.location.href : `https://el-goodnews-academy.com/invite/${token}`

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden perspective-[1200px]">
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-8 flex items-center gap-3 relative z-10">
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl">
          <GraduationCap className="text-white w-7 h-7" />
        </div>
        <div>
          <span className="font-black text-2xl tracking-tight text-white uppercase">
            EL <span className="text-blue-400">LEARNERS APP</span>
          </span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invitation Onboarding</p>
        </div>
      </div>

      <Card className="max-w-md w-full border border-white/15 shadow-2xl rounded-[2.5rem] bg-slate-900/90 backdrop-blur-2xl text-white overflow-hidden relative z-10">
        <div className="h-2 bg-[#1E3A8A] w-full" />

        <CardHeader className="text-center pt-8 pb-4 space-y-2">
          <div className="mx-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Official School Invitation
          </div>
          <CardTitle className="text-2xl font-black text-white">Join EL LEARNERS APP</CardTitle>
          <CardDescription className="text-slate-400 font-bold text-xs max-w-xs mx-auto">
            Setup your password and account details to activate your access
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Validating invitation token...</p>
            </div>
          ) : success ? (
            <div className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <h3 className="text-2xl font-black text-white">Invitation Accepted!</h3>
              <p className="text-xs font-bold text-slate-300">
                Redirecting you to sign in page...
              </p>
            </div>
          ) : error && !invitation ? (
            <div className="p-8 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h3 className="text-xl font-black text-white">Invitation Invalid</h3>
              <p className="text-xs font-bold text-slate-400">{error}</p>
              <Button onClick={() => router.push('/auth/signin')} className="bg-slate-800 text-white font-black text-xs rounded-xl h-11 px-6">
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs flex justify-between items-center font-mono">
                <div>
                  <p className="text-slate-400">Target Role: <strong className="text-blue-400 font-black">{invitation.role}</strong></p>
                  <p className="text-slate-400">Invited Identifier: <strong className="text-white">{invitation.email || invitation.phone}</strong></p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase transition"
                >
                  <QrCode className="w-4 h-4" /> QR Code
                </button>
              </div>

              {showQR && (
                <div className="p-6 bg-slate-950 border border-blue-500/30 rounded-2xl text-center space-y-3 animate-in fade-in duration-200">
                  <p className="text-xs font-black text-blue-300 uppercase tracking-widest">Scan QR Code to Open on Mobile</p>
                  <QRCodeSVG value={fullInviteUrl} size={160} className="mx-auto" />
                </div>
              )}

              {/* Camera Scanner Modal Trigger */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={scanning ? stopScanner : startScanner}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition py-1 px-3 bg-slate-800/60 rounded-full border border-slate-700"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  {scanning ? 'Stop QR Camera Scanner' : 'Open Mobile QR Scanner'}
                </button>
              </div>

              {scanning && (
                <div className="p-4 bg-black rounded-2xl border border-slate-800 space-y-2 text-center relative">
                  <button onClick={stopScanner} className="absolute top-2 right-2 text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-40 object-cover rounded-xl border border-slate-700" />
                  <p className="text-[10px] text-emerald-400 font-mono animate-pulse">Scanning QR code in real time...</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-400">First Name *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 rounded-2xl border-slate-800 bg-slate-950 text-white text-xs font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-400">Last Name *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 rounded-2xl border-slate-800 bg-slate-950 text-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-slate-400">Create Password *</Label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-slate-800 bg-slate-950 text-white text-xs font-bold"
                />
              </div>

              <PasswordStrengthIndicator password={password} />

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-[#1E3A8A] hover:bg-blue-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl mt-4"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'ACCEPT INVITATION & ACTIVATE'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
