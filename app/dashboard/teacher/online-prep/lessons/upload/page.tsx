'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Video } from 'lucide-react'
import { uploadPrepLessonAction } from '@/app/actions/online-prep'

export default function TeacherOnlinePrepVideoUploadPage() {
  const [title, setTitle] = useState('')
  const [subjectName, setSubjectName] = useState('Mathematics')
  const [department, setDepartment] = useState('Science')
  const [targetClass, setTargetClass] = useState('SSS3')
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !videoUrl) {
      setError('Please provide lesson title and video URL.')
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
        targetClass,
      })

      if (!res.success) {
        setError(res.error || 'Video lesson upload failed.')
        setLoading(false)
        return
      }

      setSuccess('Video lesson session uploaded successfully!')
      setTitle('')
      setVideoUrl('')
      setDescription('')
    } catch (err: any) {
      setError(err.message || 'Upload error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-3xl mx-auto space-y-8 min-h-screen">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upload Exam Prep Video Class</h1>
          <p className="text-slate-500 font-medium text-xs mt-1">
            Upload SSS2 and SSS3 WAEC/NECO/JAMB video sessions for your registered subjects.
          </p>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-xs font-black uppercase text-slate-500">Lesson Title *</Label>
              <Input
                type="text"
                placeholder="e.g. Calculus & Trigonometry WAEC Prep"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="rounded-xl mt-1 text-xs font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Subject Name *</Label>
                <Input
                  type="text"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  className="rounded-xl mt-1 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Target Class *</Label>
                <select
                  value={targetClass}
                  onChange={e => setTargetClass(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white"
                >
                  <option value="SSS3">SSS3</option>
                  <option value="SSS2">SSS2</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-black uppercase text-slate-500">Department *</Label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-xs font-bold bg-white"
                >
                  <option value="Science">Science</option>
                  <option value="Arts">Arts / Humanities</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-slate-500">Video Embed URL (YouTube/Vimeo) *</Label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/embed/..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="rounded-xl mt-1 text-xs font-bold"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase text-slate-500">Description</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary of topic covered..."
                rows={3}
                className="w-full mt-1 border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs h-12 rounded-2xl uppercase"
            >
              {loading ? 'Uploading Video...' : 'Upload Video Session'}
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
