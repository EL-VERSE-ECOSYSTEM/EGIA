'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HelpCircle, Send, MessageSquare } from 'lucide-react'
import { createSupportTicket } from '@/app/actions/support'

export default function NewSupportTicketPage() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'MEDIUM',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createSupportTicket(formData)
      alert('Support ticket created successfully! Our team will contact you shortly.')
      setFormData({ title: '', category: '', priority: 'MEDIUM', description: '' })
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Failed to create support ticket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Technical Support</h1>
          <p className="text-slate-500 font-medium text-lg">Need help with the app or portal? Create a support ticket.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 bg-slate-50/50">
                <CardTitle className="text-2xl font-black text-slate-900">Create Ticket</CardTitle>
                <CardDescription>Our technical team typically responds within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Problem Summary</Label>
                    <Input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Cannot view child results"
                      className="h-12 rounded-xl bg-slate-50 border-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Category</Label>
                      <Select onValueChange={(v) => setFormData({...formData, category: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none">
                          <SelectValue placeholder="Issue Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Login Issue">Login/Account</SelectItem>
                          <SelectItem value="Payment Error">Payment Error</SelectItem>
                          <SelectItem value="Result Access">Result Access</SelectItem>
                          <SelectItem value="Bug Report">Bug Report</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Urgency</Label>
                      <Select defaultValue="MEDIUM" onValueChange={(v) => setFormData({...formData, priority: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black text-slate-700 uppercase tracking-widest text-[10px]">Describe the Issue</Label>
                    <Textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Tell us what happened..."
                      className="min-h-[150px] rounded-2xl bg-slate-50 border-none p-4"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-16 rounded-2xl font-black text-lg transition-all shadow-xl"
                  >
                    {isSubmitting ? 'Sending...' : 'Submit Support Request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-amber-500 text-white p-8">
                <HelpCircle className="w-12 h-12 mb-6 opacity-50" />
                <h3 className="text-xl font-black mb-2">Check FAQs First</h3>
                <p className="text-sm font-medium opacity-90 mb-6">Most common issues are already resolved in our help center.</p>
                <Button className="w-full bg-white text-amber-600 hover:bg-amber-50 font-bold rounded-xl h-12">
                   Browse Knowledge Base
                </Button>
             </Card>

             <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                   </div>
                   <h4 className="font-black text-slate-900 text-sm">Direct Contact</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   If this is an emergency, you can call our support line at +234 800-GOODNEWS during school hours.
                </p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
