'use client'

import React, { useState, useEffect, use } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { getAssessmentById, updateAssessmentAndResubmit } from '@/app/actions/teacher'
import { AlertTriangle, Plus, Trash2, Check, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function EditTeacherAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const assessmentId = unwrappedParams.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assessmentData, setAssessmentData] = useState<any>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [passingScore, setPassingScore] = useState(40)
  const [questions, setQuestions] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const data = await getAssessmentById(assessmentId)
        if (!data) {
          toast.error('Assessment not found')
          return
        }
        setAssessmentData(data)
        setTitle(data.title || '')
        setDescription(data.description || '')
        setDuration(data.duration || 60)
        setPassingScore(data.passingScore || 40)
        setQuestions((data.questions || []).map((q: any) => ({
          questionText: q.questionText || '',
          questionType: q.questionType || 'multiple_choice',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correctAnswer || '',
          marks: q.points || 1
        })))
      } catch (err: any) {
        toast.error('Failed to load assessment')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assessmentId])

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1
      }
    ])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev => {
      const copy = [...prev]
      const optionsCopy = [...(copy[qIndex].options || ['', '', '', ''])]
      optionsCopy[optIndex] = value
      copy[qIndex].options = optionsCopy
      return copy
    })
  }

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Assessment title is required')
      return
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question before submitting')
      return
    }

    setSubmitting(true)
    try {
      await updateAssessmentAndResubmit({
        id: assessmentId,
        title,
        description,
        duration: Number(duration),
        passingScore: Number(passingScore),
        questions
      })
      toast.success('Assessment updated & re-submitted to Admin for approval!')
      router.push('/dashboard/teacher/assessments/drafts')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to re-submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="p-16 text-center font-bold text-slate-400">Loading assessment details...</div>
      </DashboardLayout>
    )
  }

  const isRejected = assessmentData?.status === 'rejected'

  return (
    <DashboardLayout role="teacher">
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teacher/assessments/drafts">
            <Button variant="outline" size="icon" className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Edit & Re-submit Assessment
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Update question set or configuration and submit to Admin for approval.
            </p>
          </div>
        </div>

        {isRejected && (
          <Card className="border-2 border-rose-400 dark:border-rose-900 bg-rose-500/10 p-6 rounded-[2rem]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-rose-900 dark:text-rose-200 text-lg uppercase">
                  Returned by Admin for Revision
                </h3>
                <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                  Admin Feedback: "{assessmentData?.adminComment || 'Please revise the questions or details before re-submitting.'}"
                </p>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleResubmit} className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-900 dark:border dark:border-slate-800 p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Assessment Title</Label>
              <Input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                placeholder="e.g. Mid-Term General Mathematics Exam"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Description / Instructions</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="min-h-24 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                placeholder="Enter instructions for pupils/students..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Duration (Minutes)</Label>
                <Input
                  type="number"
                  required
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Passing Score (%)</Label>
                <Input
                  type="number"
                  required
                  value={passingScore}
                  onChange={e => setPassingScore(Number(e.target.value))}
                  className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>
          </Card>

          {/* Question Editor */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Questions List ({questions.length})</h2>
              <Button
                type="button"
                onClick={handleAddQuestion}
                variant="outline"
                className="h-11 px-5 rounded-xl border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-black text-xs gap-2"
              >
                <Plus className="w-4 h-4" /> ADD QUESTION
              </Button>
            </div>

            {questions.map((q, qIdx) => (
              <Card key={qIdx} className="border-none shadow-xl rounded-[2rem] bg-white dark:bg-slate-900 dark:border dark:border-slate-800 p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">Question #{qIdx + 1}</h3>
                  <Button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    variant="ghost"
                    size="icon"
                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Question Text</Label>
                  <Textarea
                    required
                    value={q.questionText}
                    onChange={e => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                    className="min-h-20 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    placeholder="Type the question prompt..."
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Options (Multiple Choice)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(q.options || ['', '', '', '']).map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">Option {String.fromCharCode(65 + optIdx)}</span>
                        <Input
                          value={opt}
                          onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                          className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Correct Answer</Label>
                  <Input
                    required
                    value={q.correctAnswer}
                    onChange={e => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                    className="h-11 rounded-xl border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-bold text-xs"
                    placeholder="Enter correct option text or answer string..."
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg gap-2 shadow-xl shadow-purple-600/20"
            >
              <Send className="w-5 h-5" /> RE-SUBMIT TO ADMIN FOR APPROVAL
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
