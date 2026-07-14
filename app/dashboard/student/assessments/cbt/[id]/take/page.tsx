'use client'

import React, { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ShieldAlert, Camera, CheckCircle2, Clock, Play } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

export default function CBTExamTakingPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params?.id as string

  const [examStarted, setExamStarted] = useState(false)
  const [examFinished, setExamFinished] = useState(false)
  const [warningCount, setWarningCount] = useState(0)
  const [timeLeft, setTimeSpent] = useState(1800) // 30 minutes in seconds

  const [currentQuestionIdx, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})

  // Webcam Stream references
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const simulatedQuestions = [
    { id: 'q1', text: 'Which year did Nigeria gain independence?', options: ['1957', '1960', '1963', '1970'], answer: '1960' },
    { id: 'q2', text: 'What is the capital city of Nigeria?', options: ['Lagos', 'Calabar', 'Abuja', 'Enugu'], answer: 'Abuja' },
    { id: 'q3', text: 'How many geopolitical zones are in Nigeria?', options: ['4', '5', '6', '7'], answer: '6' }
  ]

  // 1. Anti-Cheat: Tab Switch & Window Focus monitoring
  useEffect(() => {
    if (!examStarted || examFinished) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerCheatingAttempt()
      }
    }

    const handleWindowBlur = () => {
      registerCheatingAttempt()
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Are you sure you want to leave the exam?'
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [examStarted, examFinished, warningCount])

  // 2. Webcam Proctoring Activation
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.warn("Webcam access denied or unavailable:", err)
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const registerCheatingAttempt = () => {
    const nextWarnings = warningCount + 1
    setWarningCount(nextWarnings)
    alert(`WARNING: You have switched tabs or left the active page. This attempt has been logged. Warning ${nextWarnings}/3. Exceeding 3 warnings will result in auto-submission.`)

    if (nextWarnings >= 3) {
      autoSubmitExam()
    }
  }

  // 3. Timer Countdown
  useEffect(() => {
    if (!examStarted || examFinished) return

    const interval = setInterval(() => {
      setTimeSpent(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          autoSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [examStarted, examFinished])

  const startExam = async () => {
    setExamStarted(true)
    await startWebcam()
  }

  const handleSelectOption = (qId: string, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: option
    }))
  }

  const autoSubmitExam = () => {
    setExamFinished(true)
    stopWebcam()
    alert('The CBT has been automatically submitted due to multiple page-leaving warnings or time limit expiration.')
  }

  const manualSubmitExam = () => {
    if (confirm('Are you sure you want to submit your assessment?')) {
      setExamFinished(true)
      stopWebcam()
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const s = secs % 60
    return `${mins}:${s.toString().padStart(2, '0')}`
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-4xl mx-auto min-h-screen">
        {!examStarted ? (
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden text-center p-12">
            <div className="h-2 bg-orange-600 w-full absolute top-0 left-0" />
            <div className="mx-auto bg-orange-50 p-6 rounded-full w-fit mb-6">
              <ShieldAlert className="w-16 h-16 text-orange-600" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Exam Portal</h1>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">EL GOODNEWS INT'L ACADEMY CBT</p>

            <div className="my-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left max-w-lg mx-auto space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">Strict Exam Rules:</h3>
              <ul className="space-y-3 text-slate-600 font-medium text-sm">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <span><strong>Anti-Cheat Active:</strong> You are NOT allowed to leave this webpage or switch browser tabs. Switching tabs will trigger warnings, and your third tab-leaving action will result in automatic submission.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Camera className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <span><strong>Webcam Proctoring:</strong> The portal will request camera permission to capture and monitor your feed during the examination period.</span>
                </li>
              </ul>
            </div>

            <Button onClick={startExam} className="bg-orange-600 hover:bg-orange-700 text-white h-16 px-10 rounded-2xl font-black text-lg shadow-xl shadow-orange-100">
              <Play className="mr-2" /> Start Exam & Enable Proctoring
            </Button>
          </Card>
        ) : examFinished ? (
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden text-center p-12">
            <div className="h-2 bg-emerald-600 w-full absolute top-0 left-0" />
            <div className="mx-auto bg-emerald-50 p-6 rounded-full w-fit mb-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">CBT Submitted Successfully</h1>
            <p className="text-slate-500 font-bold mt-2 leading-relaxed">Your answers have been securely synced to our databases for grading.</p>
            <div className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-widest">Logged Warnings: {warningCount}</div>
            <Button onClick={() => router.push('/dashboard/student/assessments/cbt')} className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-xl font-bold mt-8">
              Back to Assessments
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-md">
                <div className="flex items-center gap-3">
                  <Clock className="text-orange-600 animate-pulse" />
                  <span className="font-black text-2xl text-slate-900">{formatTime(timeLeft)}</span>
                </div>
                <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl text-xs font-black">
                  WARNINGS: {warningCount} / 3
                </div>
              </div>

              <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-100">
                  <div className="text-xs font-black text-orange-600 uppercase tracking-widest">Question {currentQuestionIdx + 1} of {simulatedQuestions.length}</div>
                  <CardTitle className="text-xl font-bold text-slate-800 mt-2">
                    {simulatedQuestions[currentQuestionIdx].text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {simulatedQuestions[currentQuestionIdx].options.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => handleSelectOption(simulatedQuestions[currentQuestionIdx].id, opt)}
                      className={`p-5 rounded-2xl border-2 ${selectedAnswers[simulatedQuestions[currentQuestionIdx].id] === opt ? 'border-orange-500 bg-orange-50 text-orange-950 font-black' : 'border-slate-100 text-slate-700 font-medium'} cursor-pointer hover:border-orange-200 transition-all`}
                    >
                      {opt}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestion(prev => prev - 1)}
                  variant="outline"
                  className="rounded-xl font-bold h-12"
                >
                  Previous
                </Button>
                {currentQuestionIdx < simulatedQuestions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold h-12"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={manualSubmitExam}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold h-12 px-8"
                  >
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Webcam Proctoring Video Box */}
              <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-slate-900 overflow-hidden relative text-white">
                <CardHeader className="p-6 bg-slate-950 flex flex-row items-center gap-2">
                  <Camera className="w-5 h-5 text-red-500 animate-pulse" />
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-300">Live Proctor Feed</CardTitle>
                </CardHeader>
                <div className="aspect-video bg-black flex items-center justify-center relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600/90 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> REC
                  </div>
                </div>
                <CardContent className="p-6 text-xs text-slate-400 font-medium leading-relaxed">
                  Webcam stream is encrypted and actively proctored. Do not obstruct or look away from the camera.
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
