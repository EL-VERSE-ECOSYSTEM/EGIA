'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Settings, ShieldCheck, User, Users, Save, CheckCircle2 } from 'lucide-react'
import { getAllTeachersWithWallets } from '@/app/actions/teacher'
import { appointAdultTeacher, getAppointedTeacher } from '@/app/actions/adult-education'
import { getSchoolStudentControlsAction, saveSchoolStudentControlsAction, SchoolStudentControls } from '@/app/actions/school-controls'
import { Clock, Gamepad2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminGeneralSettingsPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [appointedId, setAppointedId] = useState('admin')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Student Gameplay & Messaging Controls State
  const [controls, setControls] = useState<SchoolStudentControls>({
    gameplayAllowed: true,
    gameplayStartHour: 12,
    gameplayEndHour: 18,
    messagingAllowed: true,
    messagingStartHour: 8,
    messagingEndHour: 18,
  })
  const [savingControls, setSavingControls] = useState(false)

  const loadData = async () => {
    try {
      const list = await getAllTeachersWithWallets()
      setTeachers(list || [])

      const current = await getAppointedTeacher()
      setAppointedId(current?.id || 'admin')

      const ctrlRes = await getSchoolStudentControlsAction()
      if (ctrlRes) {
        setControls(ctrlRes)
      }
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

  const handleSaveControls = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingControls(true)
    try {
      await saveSchoolStudentControlsAction(controls)
      toast.success('Student gameplay & messaging time controls updated in real time!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save controls')
    } finally {
      setSavingControls(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-4xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">General & Academy Settings</h1>
          <p className="text-slate-500 font-medium text-lg font-bold">Manage global configurations, school parameters, student time restrictions, and staff appointments.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing settings cache...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {/* Student Gameplay & Messaging Controls Card */}
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-10 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-500" />
                  <div>
                    <CardTitle className="text-xl font-black">Student Gameplay & Messaging Time Controls</CardTitle>
                    <CardDescription className="text-slate-400">Set permitted hours and feature toggles for pupil gameplay and chat messaging in real time.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleSaveControls} className="space-y-6">
                  {/* Gameplay Section */}
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-purple-600" />
                        <span className="font-black text-sm text-slate-900">Educational Games Access</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={controls.gameplayAllowed}
                          onChange={e => setControls({ ...controls, gameplayAllowed: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Games Allowed From Hour (0 - 23)</Label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={controls.gameplayStartHour}
                          onChange={e => setControls({ ...controls, gameplayStartHour: Number(e.target.value) })}
                          className="w-full mt-1 h-11 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Games Allowed Until Hour (0 - 23)</Label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={controls.gameplayEndHour}
                          onChange={e => setControls({ ...controls, gameplayEndHour: Number(e.target.value) })}
                          className="w-full mt-1 h-11 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Messaging Section */}
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <span className="font-black text-sm text-slate-900">Student Messaging System Access</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={controls.messagingAllowed}
                          onChange={e => setControls({ ...controls, messagingAllowed: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Messaging Allowed From Hour (0 - 23)</Label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={controls.messagingStartHour}
                          onChange={e => setControls({ ...controls, messagingStartHour: Number(e.target.value) })}
                          className="w-full mt-1 h-11 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-600">Messaging Allowed Until Hour (0 - 23)</Label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={controls.messagingEndHour}
                          onChange={e => setControls({ ...controls, messagingEndHour: Number(e.target.value) })}
                          className="w-full mt-1 h-11 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingControls}
                    className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2"
                  >
                    {savingControls ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />}
                    SAVE TIME RESTRICTION CONTROLS
                  </Button>
                </form>
              </CardContent>
            </Card>

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
