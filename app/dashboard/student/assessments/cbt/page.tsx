'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Flag,
  Monitor
} from 'lucide-react'

export default function CBTInterfacePage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(3600) // 60 mins

  const questions = [
    {
      id: 1,
      type: 'MCQ_SINGLE',
      text: 'What is the value of 5x + 3 when x = 2?',
      options: ['A. 10', 'B. 13', 'C. 15', 'D. 18']
    },
    {
      id: 2,
      type: 'TRUE_FALSE',
      text: 'All prime numbers are odd numbers.',
      options: ['True', 'False']
    },
    {
      id: 3,
      type: 'FITB',
      text: 'The square root of 144 is [BLANK_1].',
      options: []
    }
  ]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Exam Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Monitor className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none">Mathematics Mid-Term Exam</h1>
              <p className="text-xs text-slate-500 mt-1">JSS 3 | 2024 First Term</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time Remaining</p>
              <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="hidden md:block w-32">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Progress</p>
              <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2 bg-slate-100" />
            </div>
            <Button className="bg-orange-600 hover:bg-orange-700 font-bold px-8">Submit Exam</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <Card className="border-none shadow-sm min-h-[400px] flex flex-col">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                  Question {currentQuestion + 1} of {questions.length}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600">
                    <Flag className="w-4 h-4 mr-1" /> Report Issue
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <div className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">
                {questions[currentQuestion].text}
              </div>

              {questions[currentQuestion].type === 'MCQ_SINGLE' && (
                <RadioGroup className="space-y-4">
                  {questions[currentQuestion].options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-3 p-4 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer">
                      <RadioGroupItem value={opt} id={`opt-${i}`} className="border-slate-300 text-orange-600" />
                      <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer font-medium text-slate-700">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {questions[currentQuestion].type === 'FITB' && (
                <div className="max-w-md">
                  <Input placeholder="Type your answer here..." className="h-14 text-lg border-2 border-slate-200 focus:border-orange-400" />
                </div>
              )}

              {questions[currentQuestion].type === 'TRUE_FALSE' && (
                <RadioGroup className="flex gap-4">
                  {questions[currentQuestion].options.map((opt, i) => (
                    <div key={i} className="flex-1 flex items-center space-x-3 p-6 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer">
                      <RadioGroupItem value={opt} id={`tf-${i}`} />
                      <Label htmlFor={`tf-${i}`} className="flex-1 cursor-pointer font-bold text-lg text-slate-700 text-center">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
            <div className="p-6 border-t bg-slate-50/30 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous Question
              </Button>
              <Button
                onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                className="bg-slate-900"
              >
                {currentQuestion === questions.length - 1 ? 'Finish & Review' : 'Next Question'}
                {currentQuestion !== questions.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </Card>

          <div className="flex gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              Your progress is being saved automatically. Do not refresh or close this tab until you have submitted the exam.
            </p>
          </div>
        </div>

        <aside className="w-full lg:w-80 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600" /> Question Palette
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => (
                  <Button
                    key={i}
                    variant={i === currentQuestion ? 'default' : 'outline'}
                    className={`h-10 w-10 p-0 font-bold ${i === currentQuestion ? 'bg-orange-600' : 'text-slate-400 border-slate-200'}`}
                    onClick={() => setCurrentQuestion(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <div className="mt-6 space-y-3 pt-6 border-t">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <div className="w-3 h-3 rounded bg-orange-600"></div> Current
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div> Answered
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <div className="w-3 h-3 rounded bg-slate-200"></div> Not Visited
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-slate-400 text-sm">Exam Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-slate-300 leading-relaxed">
              <p>• Ensure a stable internet connection.</p>
              <p>• All questions are compulsory.</p>
              <p>• Do not use unauthorized materials.</p>
              <p>• System will auto-submit when time expires.</p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}
