'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, CheckCircle2, Clock, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react'
import { getPrepQuestionsAction } from '@/app/actions/online-prep'
import { OnlinePrepModal } from '@/components/online-prep/OnlinePrepModal'

export default function OnlinePrepPracticePage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await getPrepQuestionsAction()
        setQuestions(data || [])
      } catch (err) {
        console.warn('Failed to load prep questions:', err)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [])

  const handleSelectOption = (qId: string, option: string) => {
    if (submitted) return
    setUserAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  return (
    <DashboardLayout role="student">
      <OnlinePrepModal />
      <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> WAEC / NECO / JAMB PRACTICE
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Practice Questions</h1>
            <p className="text-slate-500 font-medium text-xs mt-1">
              Interactive exam prep questions uploaded by teachers and Super Admin.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold">Loading questions...</div>
        ) : questions.length === 0 ? (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-12 text-center space-y-4">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">No Practice Questions Uploaded Yet</h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
              Your teachers and Super Admin will upload department-specific WAEC, NECO & JAMB practice questions shortly.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const selected = userAnswers[q.id]
              const isCorrect = selected === q.correctAnswer

              return (
                <Card key={q.id} className="border-none shadow-xl rounded-[2rem] bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-orange-600 uppercase tracking-widest">
                      {q.examType} • {q.subjectName} (Question {idx + 1})
                    </span>
                    {submitted && (
                      <Badge className={`font-black text-[10px] uppercase border-none px-3 py-1 ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </Badge>
                    )}
                  </div>

                  <p className="text-base font-bold text-slate-800">{q.questionText}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.isArray(q.options) && q.options.map((opt: string) => {
                      const isOptSelected = selected === opt
                      const isCorrectOpt = q.correctAnswer === opt

                      let style = 'border-slate-200 bg-white text-slate-700'
                      if (submitted) {
                        if (isCorrectOpt) style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black'
                        else if (isOptSelected) style = 'border-rose-500 bg-rose-50 text-rose-950 font-black'
                      } else if (isOptSelected) {
                        style = 'border-orange-500 bg-orange-50 text-orange-950 font-black'
                      }

                      return (
                        <div
                          key={opt}
                          onClick={() => handleSelectOption(q.id, opt)}
                          className={`p-4 rounded-xl border-2 text-xs font-semibold cursor-pointer transition ${style}`}
                        >
                          {opt}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}

            {!submitted && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs px-8 py-3.5 rounded-xl uppercase">
                  Submit Practice Answers
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
