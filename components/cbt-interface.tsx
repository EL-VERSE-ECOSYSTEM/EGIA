"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { submitCBT } from "@/app/actions/cbt"
import { useRouter } from "next/navigation"

interface CBTInterfaceProps {
  assessment: any
}

export default function CBTInterface({ assessment }: CBTInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(assessment.duration ? assessment.duration * 60 : 3600)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const questions = assessment.questions as any[]
  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await submitCBT(assessment.id, answers)
      router.push("/dashboard/student/results")
    } catch (error) {
      console.error(error)
      alert("Submission failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 grid gap-6 md:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-orange-50/50">
            <div>
              <CardTitle className="text-xl text-orange-700">{assessment.title}</CardTitle>
              <p className="text-sm text-orange-600">{assessment.subject.name}</p>
            </div>
            <div className="text-2xl font-mono font-bold text-orange-700">
              {formatTime(timeLeft)}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-sm">
                  {currentQuestionIndex + 1}
                </span>
                <p className="text-lg font-medium">{currentQuestion.questionText}</p>
              </div>

              <div className="grid gap-3 pl-10">
                {currentQuestion.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentQuestionIndex]: option })}
                    className={cn(
                      "flex items-center p-4 border rounded-xl transition-all text-left hover:border-orange-400",
                      answers[currentQuestionIndex] === option
                        ? "bg-orange-600 text-white border-orange-600 shadow-md"
                        : "bg-white text-slate-700 border-slate-200"
                    )}
                  >
                    <span className="w-6 font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center bg-white p-4 border rounded-xl">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          >
            Previous
          </Button>
          <div className="space-x-2">
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 px-8"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Exam"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-orange-200 h-fit">
          <CardHeader className="border-b bg-orange-50/50">
            <CardTitle className="text-sm font-bold">Question Palette</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
                    currentQuestionIndex === idx ? "ring-2 ring-orange-600 ring-offset-2" : "",
                    answers[idx]
                      ? "bg-green-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-slate-100 rounded border" />
                <span>Unanswered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
