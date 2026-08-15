'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Filter, MoreVertical, MessageSquare, AlertCircle, ShieldAlert } from 'lucide-react'

import { getAdminDisputes, resolveDispute } from '@/app/actions/admin-ops'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadDisputes = async () => {
    try {
      const data = await getAdminDisputes()
      setDisputes(data || [])
    } catch (err: any) {
      console.error('Failed to load disputes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisputes()
  }, [])

  // Real-time Supabase Database Sync for disputes
  useRealtimeSubscription('dispute', () => {
    loadDisputes()
    toast('Disputes updated in real time')
  })

  const handleResolve = async () => {
    if (!selectedDispute || !resolutionNote.trim()) {
      return toast.error('Please enter resolution notes.')
    }
    setSubmitting(true)
    try {
      await resolveDispute(selectedDispute.id, resolutionNote)
      toast.success('Dispute ticket marked as resolved!')
      setSelectedDispute(null)
      setResolutionNote('')
      loadDisputes()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredDisputes = disputes.filter(d => {
    const tNum = (d.ticketNumber || '').toLowerCase()
    const title = (d.title || '').toLowerCase()
    const name = (d.raisedByName || '').toLowerCase()
    return tNum.includes(search.toLowerCase()) || title.includes(search.toLowerCase()) || name.includes(search.toLowerCase())
  })

  const activeCount = disputes.filter(d => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Dispute Management</h1>
            <p className="text-slate-500 font-medium text-lg">System-wide oversight and resolution of all parent and student grievances in real time.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-amber-100 px-6 py-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="text-amber-600" />
                <div className="leading-none">
                   <p className="text-2xl font-black text-amber-700">{activeCount}</p>
                   <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Active Disputes</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-7 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  className="pl-12 h-14 rounded-2xl bg-white border-none font-medium shadow-sm"
                  placeholder="Search by Ticket ID, title or user name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {loading ? (
                 <div className="p-20 text-center text-slate-400 font-bold">Loading dispute logs...</div>
               ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Raised By</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredDisputes.length === 0 ? (
                             <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-bold">No dispute cases found in database.</td></tr>
                          ) : filteredDisputes.map(d => (
                             <tr
                               key={d.id}
                               onClick={() => setSelectedDispute(d)}
                               className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${selectedDispute?.id === d.id ? 'bg-amber-50/30' : ''}`}
                             >
                                <td className="p-6">
                                   <p className="font-black text-slate-900">{d.ticketNumber}</p>
                                   <p className="text-[10px] font-bold text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="p-6">
                                   <p className="font-bold text-slate-800">{d.raisedByName}</p>
                                   <p className="text-[10px] text-slate-400 font-medium">{d.raisedByEmail}</p>
                                </td>
                                <td className="p-6">
                                   <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold px-2.5 py-0.5 text-[10px]">
                                     {d.category}
                                   </Badge>
                                </td>
                                <td className="p-6">
                                   <Badge className={d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                     {d.status}
                                   </Badge>
                                </td>
                                <td className="p-6 text-right">
                                   <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs">
                                     MANAGE
                                   </Button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Details & Resolution Card */}
          <div className="lg:col-span-5">
            {selectedDispute ? (
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-8 space-y-6">
                <div>
                  <Badge className="bg-amber-100 text-amber-800 font-black text-[10px] mb-2">{selectedDispute.ticketNumber}</Badge>
                  <h2 className="text-2xl font-black text-slate-900">{selectedDispute.title}</h2>
                  <p className="text-xs font-bold text-slate-400 mt-1">Category: {selectedDispute.category} • Priority: {selectedDispute.priority}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Description</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedDispute.description}</p>
                </div>

                {selectedDispute.status === 'RESOLVED' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black uppercase text-emerald-700">Resolution Remarks</p>
                    <p className="text-sm font-semibold text-emerald-900">{selectedDispute.resolution || 'Resolved by Administrator.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-black uppercase text-slate-700">Admin Resolution Action</p>
                    <textarea
                      placeholder="Input resolution details and instructions..."
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <Button
                      onClick={handleResolve}
                      disabled={submitting}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs gap-2"
                    >
                      {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle size={16} />}
                      RESOLVE DISPUTE TICKET
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-bold p-8 text-center">
                Select a dispute ticket from the list to view description and manage resolution.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
