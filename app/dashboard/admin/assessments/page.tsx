'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getAllAdminAssessments, handleCBTDecision } from '@/app/actions/admin-cbt'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import {
  GraduationCap, Check, X, Eye, FileText, Search,
  Clock, Award, Activity, AlertCircle, RefreshCw, Layers
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminAssessmentsLogPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedCBT, setSelectedCBT] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending_approval' | 'approved' | 'rejected'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAssessments = async () => {
    try {
      const data = await getAllAdminAssessments()
      setAssessments(data)
    } catch (err: any) {
      toast.error('Failed to load assessment log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  // Real-time Supabase Database Sync for Assessment Table
  useRealtimeSubscription('assessment', () => {
    fetchAssessments()
    toast('Assessments updated in real-time', {
      description: 'The assessment log was updated by a teacher or system action.'
    })
  })

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setSubmitting(true)
    try {
      const result = await handleCBTDecision(id, action, comment)
      toast.success(`Assessment successfully ${action}d!`)
      if (result.accessCode) {
        toast.info(`Generated Access Code for Exam: ${result.accessCode}`, {
          duration: 10000
        })
      }
      setSelectedCBT(null)
      setComment('')
      fetchAssessments()
    } catch (err: any) {
      toast.error(err?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered List
  const filteredAssessments = assessments.filter(a => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter
    const titleMatch = (a.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    const subjectMatch = (a.subject?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const teacherMatch = (a.teacher?.firstName || '' + ' ' + a.teacher?.lastName || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && (titleMatch || subjectMatch || teacherMatch)
  })

  const pendingCount = assessments.filter(a => a.status === 'pending_approval').length
  const approvedCount = assessments.filter(a => a.status === 'approved' || a.status === 'published').length
  const rejectedCount = assessments.filter(a => a.status === 'rejected').length

  return (
    <DashboardLayout role="admin">
      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Realtime Database Log
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Assessment & CBT Log
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base mt-1">
              Centralized institutional registry of tests, CBT exams, approvals, and returned revisions.
            </p>
          </div>

          <Button
            onClick={fetchAssessments}
            variant="outline"
            className="h-12 px-6 rounded-2xl border-slate-200 dark:border-slate-800 font-black text-xs gap-2 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" /> REFRESH LOG
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] bg-white dark:bg-slate-900 dark:border dark:border-slate-800">
            <CardContent className="p-6">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total CBTs Logged</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{assessments.length}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] bg-amber-500/10 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <CardContent className="p-6">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Pending Approval</p>
              <h3 className="text-3xl font-black text-amber-700 dark:text-amber-300">{pendingCount}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <CardContent className="p-6">
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Approved & Active</p>
              <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{approvedCount}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] bg-rose-500/10 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
            <CardContent className="p-6">
              <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Returned / Rejected</p>
              <h3 className="text-3xl font-black text-rose-700 dark:text-rose-300">{rejectedCount}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter bar */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-slate-900 dark:border dark:border-slate-800 p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search CBTs by title, subject, teacher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {[
                { label: 'ALL LOGS', value: 'ALL' },
                { label: 'PENDING APPROVAL', value: 'pending_approval' },
                { label: 'APPROVED', value: 'approved' },
                { label: 'RETURNED / REJECTED', value: 'rejected' },
              ].map(f => (
                <Button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value as any)}
                  variant={statusFilter === f.value ? 'default' : 'ghost'}
                  className={`rounded-xl h-10 text-xs font-black px-4 ${
                    statusFilter === f.value
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Assessment List */}
          <div className="lg:col-span-5 space-y-4">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold">Loading real-time assessment log...</div>
            ) : filteredAssessments.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 font-semibold dark:bg-slate-900">
                No assessments match the selected filter.
              </Card>
            ) : (
              filteredAssessments.map((cbt) => {
                const isSelected = selectedCBT?.id === cbt.id
                return (
                  <Card
                    key={cbt.id}
                    onClick={() => {
                      setSelectedCBT(cbt)
                      setComment(cbt.adminComment || '')
                    }}
                    className={`border-2 rounded-[2rem] cursor-pointer transition-all overflow-hidden ${
                      isSelected
                        ? 'border-amber-500 shadow-lg bg-amber-50/10 dark:bg-amber-950/20'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={
                          cbt.status === 'approved' || cbt.status === 'published'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-none font-bold'
                            : cbt.status === 'rejected'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-none font-bold'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-none font-bold'
                        }>
                          {cbt.status === 'approved' || cbt.status === 'published'
                            ? 'Approved'
                            : cbt.status === 'rejected'
                            ? 'Returned to Teacher'
                            : 'Pending Approval'}
                        </Badge>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none font-bold uppercase tracking-wider text-[10px]">
                          {cbt.subject?.name || 'Subject'}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{cbt.title}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                          Teacher: {cbt.teacher ? `${cbt.teacher.firstName} ${cbt.teacher.lastName}` : 'Faculty Member'} • {cbt.duration} Mins
                        </p>
                      </div>

                      {cbt.accessCode && (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Access Code</span>
                          <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm tracking-widest">{cbt.accessCode}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Assessment Review & Action Pane */}
          <div className="lg:col-span-7">
            {selectedCBT ? (
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-900 dark:border dark:border-slate-800 overflow-hidden sticky top-8">
                <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">{selectedCBT.title}</CardTitle>
                      <CardDescription className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                        Type: {selectedCBT.type} • Subject: {selectedCBT.subject?.name || 'General'}
                      </CardDescription>
                    </div>
                    <Badge className={
                      selectedCBT.status === 'approved' || selectedCBT.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : selectedCBT.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800 font-bold'
                        : 'bg-amber-100 text-amber-800 font-bold'
                    }>
                      {selectedCBT.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                  {selectedCBT.status === 'rejected' && selectedCBT.adminComment && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 rounded-2xl space-y-1">
                      <p className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase">Admin Feedback Provided To Teacher</p>
                      <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">{selectedCBT.adminComment}</p>
                    </div>
                  )}

                  {selectedCBT.description && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <p className="text-xs font-black text-slate-400 uppercase mb-1">Description</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedCBT.description}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-500" /> Questions List ({selectedCBT.questions?.length || 0})
                    </h4>

                    <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                      {selectedCBT.questions?.map((q: any, i: number) => (
                        <div key={q.id} className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-800/50">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Q{i + 1}. {q.questionText}
                          </p>
                          {q.options && Array.isArray(q.options) && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt: string, idx: number) => (
                                <div key={idx} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-300">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            Correct Answer: {q.correctAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-sm font-black text-slate-700 dark:text-slate-300">Review Comments / Instructions for Teacher</Label>
                    <Textarea
                      placeholder="Enter feedback or reasons if returning/rejecting this assessment..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="min-h-24 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button
                      disabled={submitting}
                      onClick={() => handleDecision(selectedCBT.id, 'reject')}
                      variant="outline"
                      className="flex-1 h-14 rounded-2xl border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 font-black gap-2"
                    >
                      <X className="w-5 h-5" /> REJECT & RETURN TO TEACHER
                    </Button>
                    <Button
                      disabled={submitting}
                      onClick={() => handleDecision(selectedCBT.id, 'approve')}
                      className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <Check className="w-5 h-5" /> APPROVE & PUBLISH
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/30 dark:bg-slate-900/30 text-slate-400 font-bold text-center">
                Select an assessment from the log to view question details and manage approval actions.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
