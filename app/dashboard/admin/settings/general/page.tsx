'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Settings, ShieldCheck, User, Users, Save, CheckCircle2 } from 'lucide-react'
import { getAllTeachersWithWallets } from '@/app/actions/teacher'
import { appointAdultTeacher, getAppointedTeacher } from '@/app/actions/adult-education'
import { toast } from 'sonner'

export default function AdminGeneralSettingsPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [appointedId, setAppointedId] = useState('admin')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const list = await getAllTeachersWithWallets()
      setTeachers(list || [])

      const current = await getAppointedTeacher()
      setAppointedId(current?.id || 'admin')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await appointAdultTeacher(appointedId)
      toast.success('Adult Education appointed teacher updated in real-time!')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update setting')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-4xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">General & Academy Settings</h1>
          <p className="text-slate-500 font-medium text-lg font-bold">Manage global configurations, school parameters, and Adult Education staff appointments.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing settings cache...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-10 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-amber-500 animate-spin-slow" />
                  <div>
                    <CardTitle className="text-xl font-black">Adult Education Staff Appointment</CardTitle>
                    <CardDescription className="text-slate-400">Designate the teacher assigned to moderate the Adult Education program.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Appointed Program Instructor</Label>
                    <select
                      value={appointedId}
                      onChange={(e) => setAppointedId(e.target.value)}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      required
                    >
                      <option value="admin">Admin (School Principal / Default)</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} ({t.staffCode || 'No Staff ID'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-5 bg-purple-50 border border-purple-100 rounded-2xl flex gap-3 text-xs text-purple-800 font-bold leading-relaxed">
                    <ShieldCheck className="text-purple-600 w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p>Security & Permissions Mapping:</p>
                      <p className="mt-1 text-purple-600/80 font-medium">
                        The appointed teacher gains exclusive access to publish course videos, schedule live sessions, and assign assessments/tasks to enrolled adult learners. Their dashboard menu will dynamically display Adult Education management portals.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-100 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />}
                    SAVE SETTING CONFIGURATION
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
