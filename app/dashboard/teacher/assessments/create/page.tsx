'use client'

import { useState } from 'react'
import { createAssessment, addQuestion } from '@/app/actions/assessments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2 } from 'lucide-react'

const CLASSES = ['JSS1A', 'JSS1B', 'JSS1C', 'JSS2A', 'JSS2B', 'JSS2C', 'JSS3A', 'JSS3B', 'JSS3C', 'SSS1A', 'SSS1B', 'SSS1C', 'SSS2A', 'SSS2B', 'SSS2C', 'SSS3A', 'SSS3B', 'SSS3C']
const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Literature', 'Government']

interface Question {
  id: string
  questionText: string
  questionType: 'mcq' | 'shortAnswer' | 'essay'
  marks: number
  options?: string[]
  correctAnswer?: string
}

export default function CreateAssessmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Mathematics',
    class: 'JSS1A',
    description: '',
    totalMarks: 100,
    duration: 60,
  })

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    questionText: '',
    questionType: 'mcq',
    marks: 5,
    options: ['', '', '', ''],
  })

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalMarks' || name === 'duration' ? parseInt(value) : value
    }))
  }

  const handleQuestionChange = (field: string, value: any) => {
    setCurrentQuestion(prev => ({ ...prev, [field]: value }))
  }

  const addQuestionToList = () => {
    if (!currentQuestion.questionText.trim()) {
      alert('Please enter a question')
      return
    }
    const newQuestion = { ...currentQuestion, id: crypto.randomUUID() }
    setQuestions([...questions, newQuestion])
    setCurrentQuestion({
      id: '',
      questionText: '',
      questionType: 'mcq',
      marks: 5,
      options: ['', '', '', ''],
    })
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (questions.length === 0) {
      alert('Add at least one question')
      return
    }
    
    setIsLoading(true)
    try {
      const assessment = await createAssessment({
        title: formData.title,
        subject: formData.subject,
        class: formData.class,
        description: formData.description,
        totalMarks: formData.totalMarks,
        duration: formData.duration,
      })

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        await addQuestion(assessment.id, {
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          options: q.options,
          correctAnswer: q.correctAnswer,
          sequence: i + 1,
        })
      }

      router.push('/dashboard/teacher/assessments')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create assessment')
    } finally {
      setIsLoading(false)
    }
  }

  const totalQuestionMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Assessment</h1>
        <p className="text-gray-600 mt-1">Design your assessment with custom questions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>Basic information about the assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assessment Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                placeholder="e.g., First Term Exam"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <select
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Enter assessment instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  name="totalMarks"
                  type="number"
                  value={formData.totalMarks}
                  onChange={handleFormChange}
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleFormChange}
                  required
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Questions</CardTitle>
            <CardDescription>Create questions for your assessment ({questions.length} added, {totalQuestionMarks}/{formData.totalMarks} marks)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
              <div className="space-y-2">
                <Label>Question</Label>
                <textarea
                  value={currentQuestion.questionText}
                  onChange={(e) => handleQuestionChange('questionText', e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <select
                    value={currentQuestion.questionType}
                    onChange={(e) => handleQuestionChange('questionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="shortAnswer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Marks</Label>
                  <Input
                    type="number"
                    value={currentQuestion.marks}
                    onChange={(e) => handleQuestionChange('marks', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              {currentQuestion.questionType === 'mcq' && (
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <textarea
                    value={currentQuestion.options?.join('\n') || ''}
                    onChange={(e) => handleQuestionChange('options', e.target.value.split('\n'))}
                    placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <Button
                type="button"
                onClick={addQuestionToList}
                className="gap-2 bg-purple-600 hover:bg-purple-700 w-full"
              >
                <PlusCircle className="w-4 h-4" />
                Add Question
              </Button>
            </div>

            {questions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Questions Added</h3>
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{idx + 1}. {q.questionText.substring(0, 50)}...</p>
                      <p className="text-xs text-gray-600">{q.questionType} - {q.marks} marks</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="p-1 hover:bg-red-200 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? 'Creating...' : 'Create Assessment'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
