'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Video, Plus, Calendar, Link as LinkIcon } from 'lucide-react'
import { createAdultClass, getAdultClasses, getCurrentUserRole } from '@/app/actions/adult-education'
import { toast } from 'sonner'

export default function TeacherManageLiveClassesPage() {
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
      const list = await getAdultClasses('LIVE').catch(() => [])
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
    if (!title || !url) return toast.error('Title and Meeting URL are required.')

    setSubmitting(true)
    try {
      await createAdultClass({
        title,
        description,
        type: 'LIVE',
        url
      })
      toast.success('Adult Education Live Class scheduled successfully!')
      setTitle('')
      setDescription('')
      setUrl('')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule live class')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Manage Live Classes</h1>
          <p className="text-slate-500 font-medium text-lg">Schedule and publish live interactive online learning meeting links for adult students.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Create Live Class Form */}
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden h-fit">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-500" /> Schedule Live Class
              </CardTitle>
              <CardDescription className="text-slate-400">Schedule real-time video tutoring</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Session Title</Label>
                  <Input
                    placeholder="e.g. Live Q&A - Vocabulary Exercises"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class Description</Label>
                  <textarea
                    placeholder="Describe the topics and schedule parameters of this upcoming live stream class..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Meeting Link (Zoom/Google Meet/Teams)</Label>
                  <Input
                    placeholder="e.g. https://meet.google.com/..."
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
                  PUBLISH LIVE MEETING
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Live Classes List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 ml-2">Scheduled Live Classes</h3>
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              </div>
            ) : classes.length === 0 ? (
              <div className="p-16 bg-white border border-slate-100 rounded-[2.5rem] text-center text-slate-400">
                <p className="font-black text-lg">No live classes scheduled yet.</p>
                <p className="text-sm font-medium mt-1">Use the scheduler panel to create your first live online class.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2 flex-1">
                        <Badge className="bg-red-100 text-red-800 border-none font-black text-[9px] tracking-wide rounded uppercase px-2 py-0.5">
                          LIVE ROOM
                        </Badge>
                        <h4 className="font-black text-slate-900 leading-snug">{cls.title}</h4>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed">{cls.description}</p>
                      </div>

                      {cls.url && (
                        <a
                          href={cls.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <Button className="w-full sm:w-auto h-11 px-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-red-100">
                            <LinkIcon className="w-3.5 h-3.5" /> JOIN ROOM
                          </Button>
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
