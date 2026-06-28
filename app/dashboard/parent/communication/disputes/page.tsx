'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Plus, Search, MessageSquare, Clock, Filter, CheckCircle2 } from 'lucide-react'
import { createDispute } from '@/app/actions/support'
import { auth } from '@/lib/auth'

export default function parentDisputesPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'MEDIUM',
    description: ''
  })

  const handleSubmit = async () => {
    if (!formData.title || !formData.category) return alert('Fill required fields')
    try {
      // In production, get user ID from session
      await createDispute({
        ...formData,
        raisedById: 'parent-sim-id'
      })
      alert('Dispute ticket raised successfully')
      setIsAdding(false)
    } catch (err) {
      alert('Failed to raise dispute')
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Dispute Resolution</h1>
            <p className="text-slate-500 font-medium text-lg">Raise and track concerns regarding payments, results, or conduct.</p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100"
          >
             <Plus className="w-6 h-6 mr-2" /> RAISE DISPUTE
          </Button>
        </div>

        {isAdding && (
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden bg-white animate-in slide-in-from-top-4 duration-500">
             <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black text-slate-900">New Dispute Ticket</CardTitle>
             </CardHeader>
             <CardContent className="p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject / Title</label>
                      <Input placeholder="e.g. Payment for Tuition not reflecting" className="h-14 rounded-xl border-slate-100 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                      <Select onValueChange={v => setFormData({...formData, category: v})}>
                         <SelectTrigger className="h-14 rounded-xl border-slate-100 font-bold">
                            <SelectValue placeholder="Select Category" />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="PAYMENT_DISCREPANCY">Payment Discrepancy</SelectItem>
                            <SelectItem value="RESULT_DISPUTE">Result Dispute</SelectItem>
                            <SelectItem value="BULLYING_COMPLAINT">Bullying Complaint</SelectItem>
                            <SelectItem value="FACILITY_COMPLAINT">Facility Complaint</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Detailed Description</label>
                   <Textarea placeholder="Explain the issue in detail..." className="min-h-[150px] rounded-2xl border-slate-100 font-medium p-6" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                   <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-black h-14 px-8">Cancel</Button>
                   <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 h-14 px-10 rounded-xl font-black shadow-lg shadow-emerald-100">Raise Ticket</Button>
                </div>
             </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[1,2].map(i => (
             <Card key={i} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden group">
                <div className={`h-2 ${i === 1 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                <CardHeader className="p-8 pb-4">
                   <div className="flex justify-between items-start mb-4">
                      <Badge className={`${i === 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} border-none font-black px-3`}>
                         {i === 1 ? 'OPEN' : 'RESOLVED'}
                      </Badge>
                      <span className="text-[10px] font-black text-slate-400">#DSP-20240625-000{i}</span>
                   </div>
                   <CardTitle className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {i === 1 ? 'Tuition Payment Discrepancy' : 'Result Clarification JSS2'}
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                   <p className="text-slate-500 text-sm font-medium line-clamp-2">
                      My payment for the first term was made via bank transfer but my child's dashboard still shows pending.
                   </p>
                   <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Clock size={14} />
                         <span className="text-[10px] font-bold">Raised 2 days ago</span>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-lg font-black text-emerald-600 hover:bg-emerald-50">VIEW THREAD</Button>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
