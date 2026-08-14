'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getApprovedCBTs } from '@/app/actions/assessments'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { BookOpen, Key, Lock, Unlock, ArrowRight, Clock, Award, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function StudentCBTDashboard() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [enteredCodes, setEnteredCodes] = useState<Record<string, string>>({})
  const [unlockedExams, setUnlockedExams] = useState<Record<string, boolean>>({})

  const fetchCBTs = async () => {
    try {
      const data = await getApprovedCBTs()
      setAssessments(data)
    } catch (err) {
      toast.error('Failed to load CBT assessments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCBTs()
  }, [])

  // Real-time Supabase updates
  useRealtimeSubscription('assessment', () => {
    fetchCBTs()
  })

  const handleVerifyCode = (cbtId: string, correctCode: string) => {
    const input = enteredCodes[cbtId]?.trim().toUpperCase()
    if (input === correctCode?.trim().toUpperCase()) {
      setUnlockedExams(prev => ({ ...prev, [cbtId]: true }))
      toast.success('Exam unlocked successfully!')
    } else {
      toast.error('Incorrect access code. Please check and try again.')
    }
  }

  const handleTakeExam = (cbtId: string) => {
    router.push(`/dashboard/student/assessments/cbt/${cbtId}/take`)
  }

  const assessmentCBTs = assessments.filter(a => a.type === 'ASSESSMENT_CBT')
  const examCBTs = assessments.filter(a => a.type === 'EXAM_CBT')

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">CBT Portal</h1>
          <p className="text-slate-500 font-medium text-lg">
            Access your real-time Assessment CBTs and unlock Exam CBTs using codes provided by the administration.
          </p>
        </div>

        {loading ? (
          <div className="p-20 text-center font-bold text-slate-400">Loading assessments...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* ASSESSMENT CBT SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-black text-slate-800">Class Assessment CBTs</h2>
              </div>
              <p className="text-slate-500 font-medium -mt-2">
                Open for everyone in the same class. No access code required.
              </p>

              {assessmentCBTs.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-100 p-12 text-center text-slate-400 font-bold rounded-[2rem]">
                  No class assessment CBTs available currently.
                </Card>
              ) : (
                assessmentCBTs.map((cbt) => (
                  <Card key={cbt.id} className="border-none shadow-xl shadow-slate-100/70 rounded-[2rem] bg-white overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-purple-100 text-purple-700 border-none font-bold px-3">
                          {cbt.subject?.name || 'Subject'}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                          <Clock className="w-4 h-4" /> {cbt.duration} mins
                        </div>
                      </div>
                      <CardTitle className="text-xl font-black text-slate-900 mt-4">{cbt.title}</CardTitle>
                      {cbt.description && <CardDescription className="text-slate-500 font-medium text-xs leading-relaxed mt-1">{cbt.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                        <HelpCircle className="w-4 h-4" /> {cbt.questions?.length || 0} Questions
                      </div>
                      <Button
                        onClick={() => handleTakeExam(cbt.id)}
                        className="bg-purple-600 hover:bg-purple-700 font-black rounded-xl h-12 px-6 shadow-lg shadow-purple-100 gap-2 text-white"
                      >
                        TAKE ASSESSMENT <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* EXAM CBT SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8 text-orange-600" />
                <h2 className="text-2xl font-black text-slate-800">Official Exam CBTs</h2>
              </div>
              <p className="text-slate-500 font-medium -mt-2">
                Requires entering the safe access code provided by your teacher or admin.
              </p>

              {examCBTs.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-100 p-12 text-center text-slate-400 font-bold rounded-[2rem]">
                  No official exam CBTs scheduled at this time.
                </Card>
              ) : (
                examCBTs.map((cbt) => {
                  const isUnlocked = unlockedExams[cbt.id]
                  return (
                    <Card key={cbt.id} className="border-none shadow-xl shadow-slate-100/70 rounded-[2rem] bg-white overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-start">
                          <Badge className="bg-orange-100 text-orange-700 border-none font-bold px-3">
                            {cbt.subject?.name || 'Subject'}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                            <Clock className="w-4 h-4" /> {cbt.duration} mins
                          </div>
                        </div>
                        <CardTitle className="text-xl font-black text-slate-900 mt-4 flex items-center gap-2">
                          {cbt.title}
                          {isUnlocked ? (
                            <Unlock className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Lock className="w-5 h-5 text-orange-500" />
                          )}
                        </CardTitle>
                        {cbt.description && <CardDescription className="text-slate-500 font-medium text-xs leading-relaxed mt-1">{cbt.description}</CardDescription>}
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold border-b border-slate-50 pb-4">
                          <HelpCircle className="w-4 h-4" /> {cbt.questions?.length || 0} Questions
                        </div>

                        {!isUnlocked ? (
                          <div className="flex gap-3">
                            <div className="relative flex-grow">
                              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                              <Input
                                placeholder="Enter access code..."
                                value={enteredCodes[cbt.id] || ''}
                                onChange={e => setEnteredCodes(prev => ({ ...prev, [cbt.id]: e.target.value }))}
                                className="pl-12 h-12 rounded-xl border-slate-200 font-bold text-slate-700 uppercase"
                              />
                            </div>
                            <Button
                              onClick={() => handleVerifyCode(cbt.id, cbt.accessCode || '')}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-12 px-6"
                            >
                              UNLOCK
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Exam Unlocked!</span>
                            <Button
                              onClick={() => handleTakeExam(cbt.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl h-12 px-6 text-white"
                            >
                              START EXAM
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
