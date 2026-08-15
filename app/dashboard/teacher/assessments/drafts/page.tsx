'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTeacherAssessments } from '@/app/actions/teacher'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import {
  FileText, AlertTriangle, Check, RefreshCw,
  Clock, Plus, Edit3, ArrowRight, Eye, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function TeacherAssessmentsDraftsPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'rejected' | 'pending_approval' | 'approved'>('ALL')

  const fetchAssessments = async () => {
    try {
      const data = await getTeacherAssessments()
      setAssessments(data)
    } catch (err) {
      toast.error('Failed to load your assessments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  useRealtimeSubscription('assessment', () => {
    fetchAssessments()
    toast.info('Assessment status updated in real time!')
  })

  const filtered = assessments.filter(a => {
    if (filter === 'ALL') return true
    if (filter === 'approved') return a.status === 'approved' || a.status === 'published'
    return a.status === filter
  })

  const rejectedCount = assessments.filter(a => a.status === 'rejected').length
  const pendingCount = assessments.filter(a => a.status === 'pending_approval').length
  const approvedCount = assessments.filter(a => a.status === 'approved' || a.status === 'published').length

  return (
    <DashboardLayout role="teacher">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              My Assessment Desk
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base mt-1">
              Track submitted CBTs, review admin feedback for returned items, and re-upload updates.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/teacher/assessments/create">
              <Button className="h-12 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs gap-2 shadow-lg shadow-purple-600/20">
                <Plus className="w-4 h-4" /> CREATE NEW CBT
              </Button>
            </Link>
          </div>
        </div>

        {/* Returned Items Urgent Banner */}
        {rejectedCount > 0 && (
          <div className="p-6 rounded-[2rem] bg-rose-500/10 border-2 border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-rose-900 dark:text-rose-200 text-lg">
                  {rejectedCount} {rejectedCount === 1 ? 'Assessment' : 'Assessments'} Returned for Revision
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                  The Admin left review feedback. Click "Edit & Re-submit" on any returned item to update and re-upload.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setFilter('rejected')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl h-10 px-4 text-xs shrink-0"
            >
              VIEW RETURNED ITEMS
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-slate-900 dark:border dark:border-slate-800">
            <CardContent className="p-6">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Awaiting Admin Approval</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{pendingCount}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-rose-500/10 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
            <CardContent className="p-6">
              <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Returned for Revision</p>
              <h3 className="text-3xl font-black text-rose-700 dark:text-rose-300">{rejectedCount}</h3>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <CardContent className="p-6">
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Approved & Published</p>
              <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{approvedCount}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'ALL ASSESSMENTS', value: 'ALL' },
            { label: 'RETURNED FOR REVISION', value: 'rejected' },
            { label: 'AWAITING APPROVAL', value: 'pending_approval' },
            { label: 'APPROVED & PUBLISHED', value: 'approved' },
          ].map(f => (
            <Button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              variant={filter === f.value ? 'default' : 'ghost'}
              className={`rounded-xl h-10 text-xs font-black px-4 ${
                filter === f.value
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Assessment Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-bold">Loading your assessment desk...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-400 font-semibold dark:bg-slate-900">
            No assessments found matching the selected filter.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map(asmt => {
              const isRejected = asmt.status === 'rejected'
              const isApproved = asmt.status === 'approved' || asmt.status === 'published'
              return (
                <Card
                  key={asmt.id}
                  className={`border-2 rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden shadow-xl transition-all ${
                    isRejected
                      ? 'border-rose-400 dark:border-rose-900 shadow-rose-500/10'
                      : isApproved
                      ? 'border-emerald-200 dark:border-emerald-900'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge className={
                        isRejected
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-none font-bold text-xs px-3'
                          : isApproved
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-none font-bold text-xs px-3'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-none font-bold text-xs px-3'
                      }>
                        {isRejected ? 'Returned by Admin' : isApproved ? 'Approved & Live' : 'Awaiting Admin Approval'}
                      </Badge>

                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none font-bold text-xs">
                        {asmt.subject?.name || 'Subject'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xl">{asmt.title}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1">
                        Type: {asmt.type} • Duration: {asmt.duration} mins • Questions: {asmt.questions?.length || 0}
                      </p>
                    </div>

                    {/* Admin Rejection Comment Box */}
                    {isRejected && (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-1">
                        <p className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-1.5 uppercase">
                          <AlertTriangle className="w-3.5 h-3.5" /> Admin Review Feedback
                        </p>
                        <p className="text-xs font-semibold text-rose-900 dark:text-rose-100 leading-relaxed">
                          "{asmt.adminComment || 'Please review questions and re-submit for approval.'}"
                        </p>
                      </div>
                    )}

                    {asmt.accessCode && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-between border border-emerald-100 dark:border-emerald-900">
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase">Exam Access Code</span>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-base">{asmt.accessCode}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                      <Link href={`/dashboard/teacher/assessments/${asmt.id}/preview`} className="flex-1">
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white">
                          <Eye className="w-4 h-4 mr-2" /> PREVIEW
                        </Button>
                      </Link>

                      {isRejected ? (
                        <Link href={`/dashboard/teacher/assessments/${asmt.id}/edit`} className="flex-1">
                          <Button className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-lg shadow-rose-600/20">
                            <Edit3 className="w-4 h-4 mr-2" /> EDIT & RE-SUBMIT
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/teacher/assessments/${asmt.id}/edit`} className="flex-1">
                          <Button variant="ghost" className="w-full h-12 rounded-xl font-bold text-slate-500 dark:text-slate-400">
                            <Edit3 className="w-4 h-4 mr-2" /> EDIT
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
