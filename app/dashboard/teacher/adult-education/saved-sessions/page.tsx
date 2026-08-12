'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, BookMarked, Plus, Calendar } from 'lucide-react'
import { createAdultClass, getAdultClasses, getCurrentUserRole } from '@/app/actions/adult-education'
import { toast } from 'sonner'

export default function TeacherManageSavedSessionsPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'teacher'>('teacher')

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')

  const loadData = async () => {
    try {
      const r = await getCurrentUserRole()
      setUserRole(r)
      const list = await getAdultClasses('SAVED_SESSION').catch(() => [])
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
    if (!title || !description) return toast.error('Title and Description are required.')

    setSubmitting(true)
    try {
      await createAdultClass({
        title,
        description,
        type: 'SAVED_SESSION',
        content,
        url: url || undefined
      })
      toast.success('Supplementary saved session resource posted successfully!')
      setTitle('')
      setDescription('')
      setContent('')
      setUrl('')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to post outline')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Manage Saved Sessions & Resources</h1>
          <p className="text-slate-500 font-medium text-lg">Post supplementary material, class handouts, study notes, or recorded session archives.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Create Resource Form */}
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden h-fit">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-amber-500" /> Post Handout/Notes
              </CardTitle>
              <CardDescription className="text-slate-400">Post extra notes or outline links</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Resource Title</Label>
                  <Input
                    placeholder="e.g. Vocabulary & Grammar Handout"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Brief Description</Label>
                  <Input
                    placeholder="e.g. Supplementary notes for our last reading..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Handout Outline & Text (Optional)</Label>
                  <textarea
                    placeholder="Type details, guidelines, vocabulary lists, or short outlines directly here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">External Resource Link (Optional)</Label>
                  <Input
                    placeholder="e.g. https://drive.google.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black text-xs flex items-center justify-center gap-2 mt-4"
                >
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  PUBLISH RESOURCE
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resources List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 ml-2">Published Supplementary Handouts</h3>
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              </div>
            ) : classes.length === 0 ? (
              <div className="p-16 bg-white border border-slate-100 rounded-[2.5rem] text-center text-slate-400">
                <p className="font-black text-lg">No handouts or notes posted yet.</p>
                <p className="text-sm font-medium mt-1">Supplementary study guides will appear here when posted.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((cls) => (
                  <Card key={cls.id} className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-3">
                    <Badge className="bg-purple-100 text-purple-800 border-none font-black text-[9px] tracking-wide rounded uppercase px-2 py-0.5">
                      RESOURCE OUTLINE
                    </Badge>
                    <div>
                      <h4 className="font-black text-slate-900 leading-snug">{cls.title}</h4>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-1 truncate">{cls.description}</p>
                    </div>
                    {cls.content && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-semibold text-slate-700 leading-relaxed max-h-[120px] overflow-y-auto">
                        {cls.content}
                      </div>
                    )}
                    {cls.url && (
                      <a
                        href={cls.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 underline uppercase"
                      >
                        Access Handout link
                      </a>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50 text-[9px] text-slate-400 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Posted on {new Date(cls.createdAt).toLocaleDateString()}</span>
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
