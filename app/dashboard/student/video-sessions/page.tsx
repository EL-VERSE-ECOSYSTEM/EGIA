'use client'

import { FormEvent, useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { askStudyVideoQuestion, getStudentStudyVideos } from '@/app/actions/study-videos'
import { SVGLoader } from '@/components/ui/svg-loader'
import { ClassCommentsSection } from '@/components/comments/ClassCommentsSection'

export default function StudentVideoSessionsPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentStudyVideos()
      .then((items) => {
        setVideos(items)
        setSelected(items[0] || null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function ask(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    try {
      await askStudyVideoQuestion(selected.id, question)
      setQuestion('')
      setError('Your teacher has received your question.')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <DashboardLayout role="student">
      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black">Study videos</h1>
          <p className="text-slate-500 mt-2">Lessons posted by your teachers for your class.</p>
        </div>

        {loading ? (
          <SVGLoader />
        ) : selected ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl overflow-hidden border border-slate-100 shadow-xl">
                <CardContent className="p-0">
                  <video className="w-full aspect-video bg-black" controls src={selected.videoUrl}>
                    Your browser does not support video playback.
                  </video>
                  <div className="p-6">
                    <h2 className="text-xl font-bold">{selected.title}</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {selected.subject} · {selected.durationMinutes || '—'} min
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{selected.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-100 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-3">Ask your teacher directly</h3>
                  <form onSubmit={ask} className="flex gap-2">
                    <Input
                      required
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a private question about this lesson"
                      className="rounded-xl h-11"
                    />
                    <Button className="h-11 px-5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500">Send</Button>
                  </form>
                  {error && <p className="text-xs font-bold text-indigo-600 mt-3">{error}</p>}
                </CardContent>
              </Card>

              {/* Class Comments Section */}
              <ClassCommentsSection
                resourceType="STUDY_VIDEO"
                resourceId={selected.id}
                title={`Lesson Discussion — ${selected.title}`}
                currentUserRole="STUDENT"
              />
            </section>

            <aside className="space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-2">Class Videos</h3>
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelected(v)
                    setError('')
                  }}
                  className="block w-full text-left"
                >
                  <Card
                    className={`rounded-2xl transition-all ${
                      selected.id === v.id ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : 'hover:border-slate-300'
                    }`}
                  >
                    <CardContent className="p-4">
                      <p className="font-bold text-sm text-slate-900">{v.title}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{v.subject}</p>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </aside>
          </div>
        ) : (
          <Card className="rounded-3xl border">
            <CardContent className="p-8 text-slate-500 font-bold">
              No study videos have been published for your class yet.
            </CardContent>
          </Card>
        )}
      </main>
    </DashboardLayout>
  )
}
