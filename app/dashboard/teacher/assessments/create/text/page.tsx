'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAssessment } from '@/app/actions/teacher'

export default function CreateAssessmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctAnswer: '', marks: 5 }])

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '', marks: 5 }])
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await createAssessment({
        title,
        subjectId: 'temp-subject-id',
        totalMarks: questions.reduce((acc, q) => acc + q.marks, 0),
        duration: 60,
        scheduleDate: new Date(),
        questions: questions.map(q => ({
            ...q,
            questionType: 'multiple_choice' as const
        }))
      })
      router.push('/dashboard/teacher/assessments/published')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Assessment</h1>
      <Card className="mb-8">
        <CardHeader><CardTitle>General Info</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Mid-Term Mathematics Exam" />
          </div>
        </CardContent>
      </Card>

      {questions.map((q, i) => (
        <Card key={i} className="mb-4">
          <CardHeader><CardTitle className="text-lg">Question {i + 1}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter question text..."
              value={q.questionText}
              onChange={e => {
                const newQs = [...questions]
                newQs[i].questionText = e.target.value
                setQuestions(newQs)
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              {q.options.map((opt, oi) => (
                <Input
                  key={oi}
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={e => {
                    const newQs = [...questions]
                    newQs[i].options[oi] = e.target.value
                    setQuestions(newQs)
                  }}
                />
              ))}
            </div>
            <div className="flex gap-4 items-center">
              <Label>Correct Answer</Label>
              <Input
                className="w-48"
                value={q.correctAnswer}
                onChange={e => {
                    const newQs = [...questions]
                    newQs[i].correctAnswer = e.target.value
                    setQuestions(newQs)
                }}
              />
              <Label>Marks</Label>
              <Input
                type="number"
                className="w-24"
                value={q.marks}
                onChange={e => {
                    const newQs = [...questions]
                    newQs[i].marks = Number(e.target.value)
                    setQuestions(newQs)
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleAddQuestion}>Add Question</Button>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Publishing...' : 'Publish Assessment'}
        </Button>
      </div>
    </div>
  )
}
