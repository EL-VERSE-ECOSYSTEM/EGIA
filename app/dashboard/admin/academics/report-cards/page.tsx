'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, X, ShieldAlert, Award, Loader2 } from 'lucide-react'
import { getReportCards, endorseReportCard, rejectReportCard, ReportCard } from '@/app/actions/report-cards'

export default function AdminReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({})
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const cards = await getReportCards()
      setReportCards(cards)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEndorse = async (id: string) => {
    setProcessing(prev => ({ ...prev, [id]: true }))
    try {
      await endorseReportCard(id, feedback[id] || 'Endorsed and approved by Academy Administration.')
      alert('Report card successfully endorsed and published!')
      fetchCards()
    } catch (err) {
      console.error(err)
      alert('Failed to endorse report card')
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleReject = async (id: string) => {
    if (!feedback[id]?.trim()) {
      return alert('Please enter feedback explaining the reason for rejection.')
    }
    setProcessing(prev => ({ ...prev, [id]: true }))
    try {
      await rejectReportCard(id, feedback[id])
      alert('Report card returned to teacher with feedback.')
      fetchCards()
    } catch (err) {
      console.error(err)
      alert('Failed to reject report card')
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Report Card Endorsement</h1>
          <p className="text-slate-500 text-lg font-medium">
             Review and endorse term report cards submitted by teachers before publishing them to parents/students.
          </p>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-slate-400 font-bold py-10 text-center">Loading pending report cards...</div>
          ) : reportCards.length === 0 ? (
            <div className="text-slate-400 font-bold py-10 text-center">No report cards logged yet</div>
          ) : (
            reportCards.map((c) => (
              <Card key={c.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <div className="h-2 bg-slate-900 w-full" />
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-50 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{c.studentName}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{c.className} • Compiled by Teacher</p>
                    </div>
                    <Badge className={
                      c.status === 'ENDORSED' ? 'bg-emerald-50 text-emerald-700 border-none font-bold px-4 py-1.5' :
                      c.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-none font-bold px-4 py-1.5' :
                      'bg-amber-50 text-amber-700 border-none font-bold px-4 py-1.5'
                    }>
                      {c.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-6">
                    <div className="space-y-4">
                      <h4 className="font-black text-sm uppercase tracking-wider text-slate-400">Subject Performance</h4>
                      <div className="space-y-2">
                        {c.marks.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-800">{m.subject}</p>
                              <p className="text-xs text-slate-400 font-bold">Test: {m.testScore} | Exam: {m.examScore}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-950">Total: {m.total}</p>
                              <Badge className="bg-slate-900 text-white font-black rounded-lg text-xs">{m.grade}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-black text-sm uppercase tracking-wider text-slate-400">Teacher Remarks</h4>
                      <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-2xl italic font-semibold text-purple-950 leading-relaxed">
                        "{c.teacherRemarks}"
                      </div>
                    </div>
                  </div>

                  {c.status === 'PENDING' ? (
                    <div className="mt-8 border-t border-slate-50 pt-6 space-y-4">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Review Comments / Endorsement Feedback</Label>
                      <div className="flex gap-4">
                        <Input
                          placeholder="Provide feedback or leave blank for default endorsement."
                          value={feedback[c.id] || ''}
                          onChange={e => setFeedback({ ...feedback, [c.id]: e.target.value })}
                          className="h-12 rounded-xl border-slate-200"
                        />
                        <Button
                          onClick={() => handleEndorse(c.id)}
                          disabled={processing[c.id]}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-6 rounded-xl flex items-center gap-1 shrink-0"
                        >
                          {processing[c.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Endorse</>}
                        </Button>
                        <Button
                          onClick={() => handleReject(c.id)}
                          disabled={processing[c.id]}
                          className="bg-red-600 hover:bg-red-700 text-white font-black h-12 px-6 rounded-xl flex items-center gap-1 shrink-0"
                        >
                          {processing[c.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <><X className="w-5 h-5" /> Reject</>}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2">
                      <Award className="text-amber-500 w-5 h-5" />
                      <p className="text-xs font-bold text-slate-600">
                        <span className="font-black text-slate-900">Admin Endorsement Note: </span>
                        {c.adminFeedback || 'Report card successfully published.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
