'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Send, Mail, Smartphone, Plus, RefreshCw, CheckCircle2, Clock, XCircle, Copy, Sparkles, Loader2 } from 'lucide-react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'

export default function AdminInvitationsPage() {
  const [invitationsList, setInvitationsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Form State
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'TEACHER' | 'PARENT' | 'STUDENT'>('TEACHER')

  const loadInvitations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/invitations')
      const data = await res.json()
      if (data.success) {
        setInvitationsList(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  // Real-time Supabase Sync
  useRealtimeSubscription('invitations', () => {
    loadInvitations()
    toast('Invitations ledger updated in real time!')
  })

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email && !phone) {
      toast.error('Please enter at least an Email address or Phone number.')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: 'school-elgoodnews-001',
          email,
          phone,
          role,
          invitedBy: 'School Administrator'
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Invitation sent successfully! Link: ${data.invitation.inviteLink}`)
        setEmail('')
        setPhone('')
        loadInvitations()
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch (err) {
      toast.error('Network error sending invitation')
    } finally {
      setSending(false)
    }
  }

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success('Invitation link copied to clipboard!')
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto min-h-screen space-y-10">
        {/* Banner with Deep Navy 3D Theme */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-[#1E3A8A] to-slate-900 p-10 text-white shadow-[0_20px_50px_rgba(30,58,138,0.2)] border border-blue-500/20">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-blue-400" /> Onboarding Management
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Teacher & Staff Invitations</h1>
            <p className="text-slate-300 font-bold text-sm">Send email & SMS invitations to Teachers, Parents, and Students with automatic school registration linkage.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Send Invitation Form */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#1E3A8A]" /> Send New Invitation
              </CardTitle>
              <CardDescription className="text-slate-400 font-bold text-xs">
                Invitee receives a secure onboarding link
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Target Role *</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-blue-800 focus:outline-none"
                >
                  <option value="TEACHER">Educator / Teacher</option>
                  <option value="PARENT">Parent / Guardian</option>
                  <option value="STUDENT">Student / Pupil</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="teacher@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Phone Number (SMS Alert)</Label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full h-14 bg-[#1E3A8A] hover:bg-blue-800 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                SEND INVITATION (EMAIL + SMS)
              </Button>
            </form>
          </Card>

          {/* Invitations Ledger Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Invitations Ledger</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-xs">
                    Real-time status tracking for active invites
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadInvitations} className="text-slate-400 hover:text-blue-800">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="p-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A] mx-auto mb-3" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading invitation logs...</p>
                  </div>
                ) : invitationsList.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-bold text-sm italic">
                    No invitations sent yet. Use the form to invite staff.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400">Invitee</TableHead>
                        <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400">Role</TableHead>
                        <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400">Status</TableHead>
                        <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 font-medium text-xs">
                      {invitationsList.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="p-4">
                            <p className="font-black text-slate-900">{inv.email || inv.phone}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell className="p-4">
                            <Badge className="bg-blue-50 text-[#1E3A8A] border border-blue-200 font-black text-[10px]">
                              {inv.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4">
                            {inv.status === 'ACCEPTED' ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] gap-1">
                                <CheckCircle2 className="w-3 h-3" /> ACCEPTED
                              </Badge>
                            ) : inv.status === 'EXPIRED' ? (
                              <Badge className="bg-red-100 text-red-800 border-none font-black text-[10px] gap-1">
                                <XCircle className="w-3 h-3" /> EXPIRED
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[10px] gap-1">
                                <Clock className="w-3 h-3" /> PENDING
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="p-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInviteLink(`http://localhost:3000/invite/${inv.token}`)}
                              className="rounded-xl h-8 text-[11px] font-bold gap-1 border-slate-200"
                            >
                              <Copy className="w-3 h-3" /> Copy Link
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
