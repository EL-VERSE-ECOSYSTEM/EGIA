'use client'

import { FormEvent, useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { publishStudyVideo, getTeacherStudyVideos } from '@/app/actions/study-videos'
import { SVGLoader } from '@/components/ui/svg-loader'
import { ClassCommentsSection } from '@/components/comments/ClassCommentsSection'

const classes = [
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 5/6',
  'JSS1',
  'JSS2',
  'JSS3',
  'SSS1',
  'SSS2',
  'SSS3',
]

export default function TeacherVideoSessionsPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    className: 'JSS1',
    videoUrl: '',
    durationMinutes: '',
  })

  const load = () =>
    getTeacherStudyVideos()
      .then(setVideos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    void load()
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await publishStudyVideo({
        ...form,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      })
      setForm({
        title: '',
        description: '',
        subject: '',
        className: 'JSS1',
        videoUrl: '',
        durationMinutes: '',
      })
      load()
    } catch (e: any) {
      setError(e.message || 'Could not publish video.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black">Study videos</h1>
          <p className="text-slate-500 mt-2">
            Publish a lesson once; only learners in the selected class can view it.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 rounded-3xl border border-slate-100 shadow-xl h-fit">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-black">Publish Lesson</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={submit} className="space-y-4">
                <Input
                  required
                  placeholder="Lesson title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-xl h-11"
                />
                <Input
                  required
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="rounded-xl h-11"
                />
                <select
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                >
                  {classes.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <Input
                  required
                  type="url"
                  placeholder="Secure video URL (https://...)"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  className="rounded-xl h-11 text-xs"
                />
                <Input
                  type="number"
                  min="1"
                  placeholder="Duration (minutes)"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="rounded-xl h-11"
                />
                <textarea
                  required
                  className="w-full min-h-28 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Lesson description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                {error && <p className="text-xs font-bold text-red-600">{error}</p>}
                <Button
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 rounded-xl font-bold text-xs"
                >
                  {saving ? 'Publishing…' : 'Publish to class'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <section className="lg:col-span-2 space-y-6">
            {loading ? (
              <SVGLoader />
            ) : videos.length ? (
              videos.map((v) => (
                <div key={v.id} className="space-y-4">
                  <Card className="rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                    <CardContent className="p-6">
                      <h2 className="font-bold text-lg text-slate-900">{v.title}</h2>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        {v.subject} · {v.className} · {v.durationMinutes || '—'} min
                      </p>
                      <p className="text-sm mt-2 text-slate-700 leading-relaxed">{v.description}</p>
                      <a
                        className="text-indigo-600 text-xs font-bold inline-block mt-3 hover:underline"
                        href={v.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open video link ↗
                      </a>
                    </CardContent>
                  </Card>

                  {/* Comment Section for Teacher */}
                  <ClassCommentsSection
                    resourceType="STUDY_VIDEO"
                    resourceId={v.id}
                    title={`Student Comments & Q&A — ${v.title}`}
                    currentUserRole="TEACHER"
                  />
                </div>
              ))
            ) : (
              <Card className="rounded-3xl border">
                <CardContent className="p-8 text-slate-500 font-bold">
                  No lessons published yet.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </DashboardLayout>
  )
}
