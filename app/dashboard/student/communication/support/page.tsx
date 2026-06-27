'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LifeBuoy, Send, Clock, CheckCircle2, MessageCircle } from 'lucide-react'
import { createSupportTicket } from '@/app/actions/support'

export default function StudentSupportPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'TECHNICAL_ISSUE'
  })

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return alert('Fill all fields')
    try {
      await createSupportTicket({
        ...formData,
        priority: 'MEDIUM',
        userId: 'student-sim-id'
      })
      alert('Support ticket created. Our team will contact you soon.')
      setIsAdding(false)
    } catch (err) {
      alert('Failed to create ticket')
    }
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Help & Support</h1>
            <p className="text-slate-500 font-medium text-lg">Facing technical issues or need help with your CBT?</p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-orange-100"
          >
             <LifeBuoy className="w-6 h-6 mr-2" /> NEW TICKET
          </Button>
        </div>

        {isAdding ? (
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden bg-white">
             <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black text-slate-900">Create Support Ticket</CardTitle>
             </CardHeader>
             <CardContent className="p-10 space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">What is the problem?</label>
                   <Input placeholder="e.g. Cannot access JSS3 Math assessment" className="h-14 rounded-xl border-slate-100 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Details</label>
                   <Textarea placeholder="Tell us more about the issue..." className="min-h-[150px] rounded-2xl border-slate-100 font-medium p-6" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                   <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-black h-14 px-8">Cancel</Button>
                   <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600 h-14 px-10 rounded-xl font-black shadow-lg shadow-orange-100">Send Ticket</Button>
                </div>
             </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-orange-100 rounded-[2rem] flex items-center justify-center text-orange-600">
                   <MessageCircle size={40} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 mb-2">Live Support</h3>
                   <p className="text-slate-500 font-medium text-sm">Chat with a support agent instantly during school hours.</p>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl border-2 font-black text-orange-600 border-orange-50 hover:bg-orange-50">START CHAT</Button>
             </Card>

             {[1,2].map(i => (
               <Card key={i} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden group">
                  <div className={`h-2 ${i === 1 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                  <CardHeader className="p-8 pb-4">
                     <div className="flex justify-between items-start mb-4">
                        <Badge className={`${i === 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} border-none font-black px-3`}>
                           {i === 1 ? 'PENDING' : 'RESOLVED'}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400">#SUP-20240625-000{i}</span>
                     </div>
                     <CardTitle className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                        {i === 1 ? 'Login issue on Mobile' : 'Assessment submission error'}
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold">Updated 3h ago</span>
                     </div>
                     <Button variant="ghost" size="sm" className="rounded-lg font-black text-orange-600">DETAILS</Button>
                  </CardContent>
               </Card>
             ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
