'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Plus, Calendar } from 'lucide-react'
import { createAdultClass, getAdultClasses, getCurrentUserRole } from '@/app/actions/adult-education'
import { toast } from 'sonner'

export default function TeacherManageAssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'teacher'>('teacher')

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')

  const loadData = async () => {
    try {
      const r = await getCurrentUserRole()
      setUserRole(r)
      const list = await getAdultClasses('ASSIGNMENT').catch(() => [])
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
    if (!title || !content) return toast.error('Title and Task Content are required.')

    setSubmitting(true)
    try {
      await createAdultClass({
        title,
        description,
        type: 'ASSIGNMENT',
        content,
        dueDate: dueDate || undefined
      })
      toast.success('Adult Education assignment published successfully!')
      setTitle('')
      setDescription('')
      setContent('')
      setDueDate('')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish assignment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Manage Assignments</h1>
          <p className="text-slate-500 font-medium text-lg">Post homework, quizzes, and tasks for enrolled adult learners to complete.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Create Assignment Form */}
          <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden h-fit">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" /> Create Assignment
              </CardTitle>
              <CardDescription className="text-slate-400">Post a new task or review question</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Task Title</Label>
                  <Input
                    placeholder="e.g. Write a Short Letter"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Brief Description</Label>
                  <Input
                    placeholder="e.g. Practice formal correspondence guidelines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Task Details & Instructions</Label>
                  <textarea
                    placeholder="Write the full assignment prompt here. Instruct students on how and what to complete..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="w-full min-h-[120px] p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black text-xs flex items-center justify-center gap-2 mt-4"
                >
                  {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  PUBLISH TASK
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 ml-2">Published Assignments</h3>
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              </div>
            ) : classes.length === 0 ? (
              <div className="p-16 bg-white border border-slate-100 rounded-[2.5rem] text-center text-slate-400">
                <p className="font-black text-lg">No assignments published yet.</p>
                <p className="text-sm font-medium mt-1">Use the left panel to publish your first assessment task.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[9px] tracking-wide rounded uppercase px-2 py-0.5">
                          ASSIGNMENT
                        </Badge>
                        <h4 className="font-black text-slate-900 leading-snug">{cls.title}</h4>
                        <p className="text-slate-500 text-xs font-semibold leading-relaxed">{cls.description}</p>
                        {cls.content && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 leading-relaxed max-w-xl">
                            {cls.content}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center shrink-0 min-w-[120px] text-[10px]">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Due Date</p>
                        <p className="font-bold text-red-600 mt-1">
                          {cls.dueDate ? new Date(cls.dueDate).toLocaleDateString() : 'No Due Date'}
                        </p>
                      </div>
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
