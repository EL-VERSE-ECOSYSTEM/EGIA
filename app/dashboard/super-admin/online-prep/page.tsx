'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ShieldCheck, Sparkles, Video, HelpCircle } from 'lucide-react'
import { uploadPrepQuestionAction, uploadPrepLessonAction } from '@/app/actions/online-prep'

export default function SuperAdminOnlinePrepPage() {
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
        setLoading(false)
        return
      }

      setSuccess('Super Admin practice question published platform-wide!')
      setQuestionText('')
      setOptions(['', '', '', ''])
      setCorrectAnswer('')
    } catch (err: any) {
      setError(err.message || 'Error uploading.')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !videoUrl) {
      setError('Fill in lesson title and video embed URL.')
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
        setError(res.error || 'Video lesson upload failed.')
        setLoading(false)
        return
      }

      setSuccess('Super Admin video lesson session published platform-wide!')
      setTitle('')
      setVideoUrl('')
      setDescription('')
    } catch (err: any) {
      setError(err.message || 'Error uploading lesson.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="super-admin">
      <div className="p-8 max-w-4xl mx-auto space-y-8 min-h-screen">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> SUPER ADMIN CONTROL
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Online Exam Prep Management</h1>
          <p className="text-slate-500 font-medium text-xs mt-1">
            Publish SSS2/SSS3 WAEC, NECO & JAMB practice questions and video classes across all schools.
          </p>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <Button
            onClick={() => setTab('question')}
            variant={tab === 'question' ? 'default' : 'outline'}
            className="rounded-xl font-bold text-xs"
          >
            <HelpCircle className="w-4 h-4 mr-2" /> Publish Questions
          </Button>
          <Button
            onClick={() => setTab('lesson')}
            variant={tab === 'lesson' ? 'default' : 'outline'}
            className="rounded-xl font-bold text-xs"
          >
            <Video className="w-4 h-4 mr-2" /> Upload Video Lesson
          </Button>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
          {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{success}</span></div>}

          {tab === 'question' ? (
            <form onSubmit={handleUploadQuestion} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Subject Name</Label>
                  <Input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="rounded-xl mt-1 text-xs font-bold" required />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Exam Type</Label>
                  <select value={examType} onChange={e => setExamType(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white">
                    <option value="WAEC">WAEC</option>
                    <option value="NECO">NECO</option>
                    <option value="JAMB">JAMB</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Department</Label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white">
                    <option value="Science">Science</option>
                    <option value="Arts">Arts / Humanities</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Question Text</Label>
                <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Question details..." rows={3} className="w-full mt-1 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:border-orange-500" required />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-slate-500">Options (A, B, C, D)</Label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase w-6">Opt {String.fromCharCode(65 + i)}</span>
                    <Input type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} className="rounded-xl text-xs font-bold flex-1" required />
                    <Button type="button" variant={correctAnswer === opt && opt ? 'default' : 'outline'} onClick={() => setCorrectAnswer(opt)} className={`text-xs font-bold rounded-xl h-10 px-3 ${correctAnswer === opt && opt ? 'bg-emerald-600 text-white' : ''}`}>
                      {correctAnswer === opt && opt ? 'Correct' : 'Mark Correct'}
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs h-12 rounded-2xl uppercase">
                {loading ? 'Publishing...' : 'Publish Practice Question'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleUploadLesson} className="space-y-6">
              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Lesson Title</Label>
                <Input type="text" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl mt-1 text-xs font-bold" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Subject Name</Label>
                  <Input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="rounded-xl mt-1 text-xs font-bold" required />
                </div>
                <div>
                  <Label className="text-xs font-black uppercase text-slate-500">Department</Label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white">
                    <option value="Science">Science</option>
                    <option value="Arts">Arts / Humanities</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Video Embed URL</Label>
                <Input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="rounded-xl mt-1 text-xs font-bold" required />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs h-12 rounded-2xl uppercase">
                {loading ? 'Uploading...' : 'Publish Video Lesson'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
