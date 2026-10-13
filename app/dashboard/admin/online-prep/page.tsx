'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ShieldCheck, Sparkles, Video, HelpCircle, BookOpen } from 'lucide-react'
import { uploadPrepQuestionAction, uploadPrepLessonAction } from '@/app/actions/online-prep'

export default function SchoolAdminOnlinePrepPage() {
  const [tab, setTab] = useState<'question' | 'lesson'>('question')

  // Question Form
  const [subjectName, setSubjectName] = useState('Mathematics')
  const [examType, setExamType] = useState('WAEC')
  const [department, setDepartment] = useState('Science')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')

  // Lesson Form
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const handleUploadQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText || options.some(o => !o) || !correctAnswer) {
      setError('Fill in all question fields and set correct answer.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await uploadPrepQuestionAction({
        subjectName,
        examType,
        department,
        questionText,
        options,
        correctAnswer,
      })

      if (!res.success) {
        setError(res.error || 'Upload failed.')
      } else {
        setSuccess('Practice Question uploaded successfully for your school!')
        setQuestionText('')
        setOptions(['', '', '', ''])
        setCorrectAnswer('')
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !videoUrl || !subjectName) {
      setError('Title, Subject, and Video URL are required.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await uploadPrepLessonAction({
        title,
        subjectName,
        department,
        videoUrl,
        description,
      })

      if (!res.success) {
        setError(res.error || 'Upload failed.')
      } else {
        setSuccess('Online Prep Lesson Video uploaded successfully for your school!')
        setTitle('')
        setVideoUrl('')
        setDescription('')
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black uppercase mb-2">
            <BookOpen className="w-3.5 h-3.5" /> School Online Prep Desk
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Online Exam Prep (WAEC / NECO / JAMB)</h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Upload practice questions and video lessons for your SSS2 & SSS3 students.
          </p>
        </div>

        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => { setTab('question'); setError(''); setSuccess(''); }}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition ${
              tab === 'question' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Upload Practice Question
          </button>
          <button
            onClick={() => { setTab('lesson'); setError(''); setSuccess(''); }}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition ${
              tab === 'lesson' ? 'border-b-2 border-amber-600 text-amber-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Upload Video Lesson Class
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {tab === 'question' ? (
          <Card className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleUploadQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Subject</Label>
                  <Input
                    value={subjectName}
                    onChange={e => setSubjectName(e.target.value)}
                    required
                    placeholder="e.g. Mathematics"
                    className="mt-1 text-xs font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Exam Type</Label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="WAEC">WAEC</option>
                    <option value="NECO">NECO</option>
                    <option value="JAMB">JAMB</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Department</Label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Question Text</Label>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  required
                  placeholder="Enter practice question..."
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Options (A, B, C, D)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt, idx) => (
                    <Input
                      key={idx}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      required
                      className="text-xs font-bold"
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Correct Answer</Label>
                <Input
                  value={correctAnswer}
                  onChange={e => setCorrectAnswer(e.target.value)}
                  required
                  placeholder="Must match one of the exact options above"
                  className="mt-1 text-xs font-bold"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase"
              >
                {loading ? 'Uploading...' : 'Publish Practice Question'}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleUploadLesson} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Lesson Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Organic Chemistry Naming Principles"
                    className="mt-1 text-xs font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Subject</Label>
                  <Input
                    value={subjectName}
                    onChange={e => setSubjectName(e.target.value)}
                    required
                    placeholder="e.g. Chemistry"
                    className="mt-1 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Department</Label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Video Embed / Class URL</Label>
                  <Input
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    required
                    placeholder="https://www.youtube.com/embed/..."
                    className="mt-1 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Lesson Summary / Description</Label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Overview of topics covered in this video class..."
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase"
              >
                {loading ? 'Uploading Video...' : 'Publish Video Class Lesson'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
