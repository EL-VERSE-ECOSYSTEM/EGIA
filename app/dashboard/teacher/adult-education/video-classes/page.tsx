'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, MonitorPlay, Plus, Calendar, Link as LinkIcon } from 'lucide-react'
import { createAdultClass, getAdultClasses, getCurrentUserRole } from '@/app/actions/adult-education'
import { toast } from 'sonner'
import { ClassCommentsSection } from '@/components/comments/ClassCommentsSection'

export default function TeacherManageVideosPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'teacher'>('teacher')

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')

  const loadData = async () => {
    try {
      const r = await getCurrentUserRole()
      setUserRole(r)
      const list = await getAdultClasses('VIDEO').catch(() => [])
      setClasses(list || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return toast.error('Title and Video URL are required.')

    setSubmitting(true)
    try {
      await createAdultClass({
        title,
        description,
        type: 'VIDEO',
        url,
      })
      toast.success('Adult Education video class uploaded successfully!')
      setTitle('')
      setDescription('')
      setUrl('')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload class')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Manage Video Classes</h1>
          <p className="text-slate-500 font-medium text-lg">Upload pre-recorded video lectures and outlines for enrolled adult learners.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Upload Form */}
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden h-fit">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-amber-500" /> Upload Video Lecture
              </CardTitle>
              <CardDescription className="text-slate-400">Post pre-recorded lessons for students</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lecture Title</Label>
                  <Input
                    placeholder="e.g. Introduction to Basic Computing"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lecture Description</Label>
                  <textarea
                    placeholder="Provide a summary of what will be learned in this video session..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Video Source URL (YouTube/Vimeo/Drive)</Label>
                  <Input
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black text-xs flex items-center justify-center gap-2 mt-4"
                >
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  PUBLISH LECTURE
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Videos List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 ml-2">Published Video Classes</h3>
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              </div>
            ) : classes.length === 0 ? (
              <div className="p-16 bg-white border border-slate-100 rounded-[2.5rem] text-center text-slate-400">
                <p className="font-black text-lg">No video lessons published yet.</p>
                <p className="text-sm font-medium mt-1">Use the upload panel to post your first video class.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {classes.map((cls) => (
                  <div key={cls.id} className="space-y-3">
                    <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white overflow-hidden p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[9px] tracking-wide rounded uppercase px-2 py-0.5">
                          VIDEO LESSON
                        </Badge>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(cls.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 leading-snug">{cls.title}</h4>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-1">{cls.description || 'No description.'}</p>
                      </div>

                      {cls.url && (
                        <a
                          href={cls.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 underline uppercase"
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Watch Video
                        </a>
                      )}
                    </Card>

                    {/* Teacher Comment Management */}
                    <ClassCommentsSection
                      resourceType="ADULT_VIDEO"
                      resourceId={cls.id}
                      title={`Comments & Student Q&A — ${cls.title}`}
                      currentUserRole="TEACHER"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
