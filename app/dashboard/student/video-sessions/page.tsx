'use client'

import { FormEvent, useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { askStudyVideoQuestion, getStudentStudyVideos } from '@/app/actions/study-videos'
import { SVGLoader } from '@/components/ui/svg-loader'

export default function StudentVideoSessionsPage() {
  const [videos, setVideos] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null); const [question, setQuestion] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { getStudentStudyVideos().then(items => { setVideos(items); setSelected(items[0] || null) }).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  async function ask(e: FormEvent) { e.preventDefault(); if (!selected) return; try { await askStudyVideoQuestion(selected.id, question); setQuestion(''); setError('Your teacher has received your question.') } catch (e: any) { setError(e.message) } }
  return <DashboardLayout role="student"><main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6"><div><h1 className="text-3xl font-black">Study videos</h1><p className="text-slate-500 mt-2">Lessons posted by your teachers for your class.</p></div>{loading ? <SVGLoader/> : selected ? <div className="grid lg:grid-cols-3 gap-6"><section className="lg:col-span-2 space-y-4"><Card><CardContent className="p-0"><video className="w-full aspect-video bg-black" controls src={selected.videoUrl}>Your browser does not support video playback.</video><div className="p-5"><h2 className="text-xl font-bold">{selected.title}</h2><p className="text-sm text-slate-500">{selected.subject} · {selected.durationMinutes || '—'} min</p><p className="mt-3 text-sm">{selected.description}</p></div></CardContent></Card><Card><CardContent className="p-5"><h3 className="font-bold mb-3">Ask your teacher</h3><form onSubmit={ask} className="flex gap-2"><Input required value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask about this lesson"/><Button>Send</Button></form>{error && <p className="text-sm text-slate-600 mt-3">{error}</p>}</CardContent></Card></section><aside className="space-y-3">{videos.map(v => <button key={v.id} onClick={() => { setSelected(v); setError('') }} className="block w-full text-left"><Card className={selected.id === v.id ? 'border-indigo-500' : ''}><CardContent className="p-4"><p className="font-bold text-sm">{v.title}</p><p className="text-xs text-slate-500 mt-1">{v.subject}</p></CardContent></Card></button>)}</aside></div> : <Card><CardContent className="p-8 text-slate-500">No study videos have been published for your class yet.</CardContent></Card>}</main></DashboardLayout>
}
