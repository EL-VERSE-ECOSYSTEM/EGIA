'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAssessment } from '@/app/actions/teacher'
import { getRegistrationSubjects } from '@/app/actions/auth-server'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/dashboard-layout'

export default function CreateAssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [duration, setDuration] = useState(60)
  const [subjects, setSubjects] = useState<any[]>([])
  const [type, setType] = useState('ASSESSMENT_CBT') // ASSESSMENT_CBT or EXAM_CBT
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctAnswer: '', imageUrl: '', marks: 5 }])

  useEffect(() => {
    async function loadSubjects() {
      try {
        const list = await getRegistrationSubjects()
        setSubjects(list || [])
        if (list && list.length > 0) {
          setSubjectId(list[0].id)
        }
      } catch (err) {
        console.error('Failed to load subjects:', err)
      }
    }
    loadSubjects()
  }, [])

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '', imageUrl: '', marks: 5 }])
  }

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      return toast.error('An assessment must have at least one question.')
    }
    setQuestions(questions.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Please enter an assessment title.')
    if (questions.some(q => !q.questionText.trim() || !q.correctAnswer.trim())) {
      return toast.error('Please ensure all questions and correct answers are filled in.')
    }

    setLoading(true)
    try {
      await createAssessment({
        title,
        description,
        type,
        subjectId,
        duration: Number(duration),
        totalMarks: questions.reduce((acc, q) => acc + q.marks, 0),
        scheduleDate: new Date(),
        questions: questions.map(q => ({
            ...q,
            questionType: 'multiple_choice'
        }))
      })
      toast.success('Assessment created successfully and submitted for Admin approval!')
      router.push('/dashboard/teacher/assessments')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assessment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manual Question Entry</h1>
          <p className="text-slate-500 font-medium">Create Assessment or Exam CBT questions manually. Submitted questions are routed to Admin in real time for approval.</p>
        </div>

        <Card className="border-none shadow-xl rounded-[2rem] bg-white">
          <CardHeader><CardTitle className="text-xl font-bold">General Assessment Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Assessment Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Mid-Term Mathematics Exam" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Subject</Label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none"
                >
                  {subjects.length === 0 ? (
                    <option value="">General Mathematics</option>
                  ) : (
                    subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code || 'SUB'})</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">CBT Category</Label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none"
                >
                  <option value="ASSESSMENT_CBT">Assessment CBT (Viewable by Class, Requires Admin Approval)</option>
                  <option value="EXAM_CBT">Exam CBT (Access code required, Requires Admin Approval)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Duration (Minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Description / Instructions</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Instructions for learners..."
                className="h-12 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Questions List ({questions.length})</h2>
          {questions.map((q, i) => (
            <Card key={i} className="border-none shadow-lg rounded-[1.5rem] bg-white p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-lg">Question {i + 1}</h3>
                <Button variant="ghost" className="text-red-500 font-bold hover:bg-red-50" onClick={() => handleRemoveQuestion(i)}>
                  Remove
                </Button>
              </div>
              <Input
                placeholder="Enter question text..."
                value={q.questionText}
                onChange={e => {
                  const newQs = [...questions]
                  newQs[i].questionText = e.target.value
                  setQuestions(newQs)
                }}
                className="h-12 rounded-xl font-semibold text-slate-800"
              />

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Question Image URL (Optional - Diagrams/Charts)</Label>
                <Input
                  placeholder="https://example.com/diagram.png"
                  value={q.imageUrl || ''}
                  onChange={e => {
                    const newQs = [...questions]
                    newQs[i].imageUrl = e.target.value
                    setQuestions(newQs)
                  }}
                  className="h-11 rounded-xl text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {q.options.map((opt, oi) => (
                  <Input
                    key={oi}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={e => {
                      const newQs = [...questions]
                      newQs[i].options[oi] = e.target.value
                      setQuestions(newQs)
                    }}
                    className="h-11 rounded-xl"
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Correct Answer (Matching text or Option letter)</Label>
                  <Input
                    placeholder="e.g. Option A text or letter"
                    value={q.correctAnswer}
                    onChange={e => {
                        const newQs = [...questions]
                        newQs[i].correctAnswer = e.target.value
                        setQuestions(newQs)
                    }}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="w-32 space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Points / Marks</Label>
                  <Input
                    type="number"
                    value={q.marks}
                    onChange={e => {
                        const newQs = [...questions]
                        newQs[i].marks = Number(e.target.value)
                        setQuestions(newQs)
                    }}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-between gap-4 pt-4">
          <Button variant="outline" onClick={handleAddQuestion} className="h-12 px-6 rounded-xl font-bold">
            + Add Another Question
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white h-12 px-8 rounded-xl font-black" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting to Admin...' : 'Submit Assessment to Admin'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
