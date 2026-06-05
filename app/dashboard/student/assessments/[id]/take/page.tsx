'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  text: string
  type: 'mcq' | 'shortAnswer' | 'essay'
  marks: number
  options?: string[]
  userAnswer?: string
  sequence: number
}

export default function CBTPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState(30 * 60) // 30 minutes in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      text: 'What is the value of 2 + 2?',
      type: 'mcq',
      marks: 5,
      options: ['3', '4', '5', '6'],
      sequence: 1,
    },
    {
      id: '2',
      text: 'Define photosynthesis',
      type: 'shortAnswer',
      marks: 5,
      sequence: 2,
    },
    {
      id: '3',
      text: 'Discuss the effects of climate change on agriculture',
      type: 'essay',
      marks: 10,
      sequence: 3,
    },
  ])

  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [submitted])

  const currentQuestion = questions[currentQuestionIndex]
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return
    }

    setSubmitted(true)
    // In production, send answers to backend
    console.log('Submitted answers:', answers)
    
    setTimeout(() => {
      router.push('/dashboard/student/assessments')
    }, 3000)
  }

  if (submitted) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Assessment Submitted</h2>
            <p className="text-gray-600">Your answers have been submitted successfully. You will see your results soon.</p>
            <Button onClick={() => router.push('/dashboard/student/assessments')} className="w-full">
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header with Timer */}
      <Card className={timeRemaining < 300 ? 'border-red-300 bg-red-50' : ''}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Mathematics Assessment</CardTitle>
            <CardDescription>Computer-Based Test (CBT)</CardDescription>
          </div>
          <div className={`text-center p-4 rounded-lg ${timeRemaining < 300 ? 'bg-red-100' : 'bg-orange-100'}`}>
            <Clock className={`w-6 h-6 mx-auto ${timeRemaining < 300 ? 'text-red-600' : 'text-orange-600'}`} />
            <p className={`font-bold text-lg ${timeRemaining < 300 ? 'text-red-600' : 'text-orange-600'}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            <p className="text-xs text-gray-600">Time Remaining</p>
          </div>
        </CardHeader>
      </Card>

      {timeRemaining < 300 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">Less than 5 minutes remaining. Please submit your assessment soon.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full p-3 rounded-lg text-sm font-medium transition-colors ${
                  currentQuestionIndex === idx
                    ? 'bg-orange-600 text-white'
                    : answers[q.id]
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Q{idx + 1}</span>
                  {answers[q.id] && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Question Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
            <CardDescription>{currentQuestion.marks} marks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-medium text-gray-900">{currentQuestion.text}</p>
            </div>

            {/* Answer Input based on Type */}
            <div className="space-y-3">
              {currentQuestion.type === 'mcq' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, idx) => (
                    <label key={idx} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span className="ml-3 text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'shortAnswer' && (
                <input
                  type="text"
                  placeholder="Enter your answer..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}

              {currentQuestion.type === 'essay' && (
                <textarea
                  placeholder="Enter your essay answer..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-32"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                variant="outline"
              >
                Next
              </Button>
              <Button
                onClick={handleSubmit}
                className="ml-auto gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
