'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getPendingAssessments, handleCBTDecision } from '@/app/actions/admin-cbt'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { Check, X, Eye, FileText, AlertCircle, Clock, Award } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminPendingCBTPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedCBT, setSelectedCBT] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchCBTs = async () => {
    try {
      const data = await getPendingAssessments()
      setAssessments(data)
      if (data.length > 0 && !selectedCBT) {
        setSelectedCBT(null)
      }
    } catch (err: any) {
      toast.error('Failed to fetch pending CBTs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCBTs()
  }, [])

  // Subscribe to real-time changes on the assessment table
  useRealtimeSubscription('assessment', () => {
    fetchCBTs()
  })

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setSubmitting(true)
    try {
      const result = await handleCBTDecision(id, action, comment)
      toast.success(`CBT successfully ${action}d!`)
      if (result.accessCode) {
        toast.info(`Generated access code: ${result.accessCode}`, {
          duration: 10000
        })
      }
      setSelectedCBT(null)
      setComment('')
      fetchCBTs()
    } catch (err: any) {
      toast.error(err?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Pending CBT Approvals</h1>
          <p className="text-slate-500 font-medium text-lg">
            Review, approve or reject Assessment and Exam CBTs uploaded by teachers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List of pending CBTs */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 px-1">Awaiting Review ({assessments.length})</h2>
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold">Loading pending CBTs...</div>
            ) : assessments.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold">
                No CBTs currently pending approval. Good job!
              </Card>
            ) : (
              assessments.map((cbt) => (
                <Card
                  key={cbt.id}
                  onClick={() => {
                    setSelectedCBT(cbt)
                    setComment('')
                  }}
                  className={`border-2 rounded-[2rem] cursor-pointer transition-all overflow-hidden ${
                    selectedCBT?.id === cbt.id
                      ? 'border-amber-500 shadow-lg bg-amber-50/10'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={cbt.type === 'EXAM_CBT' ? 'bg-orange-100 text-orange-700 border-none px-3 font-bold' : 'bg-purple-100 text-purple-700 border-none px-3 font-bold'}>
                        {cbt.type === 'EXAM_CBT' ? 'Exam CBT' : 'Assessment CBT'}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase tracking-wider text-[10px]">
                        {cbt.subject?.name || 'Subject'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight">{cbt.title}</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Duration: {cbt.duration} mins</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* CBT details review */}
          <div className="lg:col-span-7">
            {selectedCBT ? (
              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden sticky top-8">
                <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-900">{selectedCBT.title}</CardTitle>
                      <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                        CBT Type: {selectedCBT.type}
                      </CardDescription>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 border-none font-bold">Awaiting Approval</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {selectedCBT.description && (
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-sm font-semibold text-slate-700">{selectedCBT.description}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-500" /> Question List ({selectedCBT.questions?.length || 0})
                    </h4>
                    <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                      {selectedCBT.questions?.map((q: any, i: number) => (
                        <div key={q.id} className="p-5 border border-slate-100 rounded-2xl space-y-3 bg-slate-50/50">
                          <p className="font-bold text-slate-800">
                            Q{i + 1}. {q.questionText}
                          </p>
                          {q.options && Array.isArray(q.options) && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt: string, idx: number) => (
                                <div key={idx} className="p-2 bg-white rounded-lg border border-slate-100 font-medium text-slate-600">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs font-black text-emerald-600">
                            Correct Answer: {q.correctAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <Label className="text-sm font-black text-slate-700">Review Feedback / Comment</Label>
                    <Textarea
                      placeholder="Leave comments or instructions for the teacher here..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="min-h-24 rounded-2xl border-slate-200 focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button
                      disabled={submitting}
                      onClick={() => handleDecision(selectedCBT.id, 'reject')}
                      variant="outline"
                      className="flex-1 h-14 rounded-2xl border-red-100 hover:bg-red-50 hover:text-red-600 font-black gap-2 text-slate-600"
                    >
                      <X className="w-5 h-5 text-red-500" /> REJECT CBT
                    </Button>
                    <Button
                      disabled={submitting}
                      onClick={() => handleDecision(selectedCBT.id, 'approve')}
                      className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black gap-2"
                    >
                      <Check className="w-5 h-5 text-white" /> APPROVE CBT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/30 text-slate-400 font-bold text-center">
                Select a pending CBT from the list to start reviewing questions and provide approval.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
