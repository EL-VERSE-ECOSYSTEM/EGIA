'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Plus, Trash2, Save, Loader2, Check, ArrowLeft } from 'lucide-react'
import { getTimetableAction, saveTimetableAction, TimetableEntry } from '@/app/actions/timetable'
import { toast } from 'sonner'
import Link from 'next/link'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function ClassTeacherTimetablePage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.classId as string

  const [className, setClassName] = useState('SSS 2')
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // New period input state
  const [periodNumber, setPeriodNumber] = useState(1)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('08:40')
  const [subjectName, setSubjectName] = useState('Mathematics')
  const [teacherName, setTeacherName] = useState('')
  const [room, setRoom] = useState('Room 3A')

  const loadTimetable = async () => {
    setLoading(true)
    const res = await getTimetableAction(className)
    if (res.success && res.entries) {
      setEntries(res.entries as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTimetable()
  }, [className])

  const handleAddPeriod = () => {
    if (!subjectName) {
      toast.error('Please enter a subject name.')
      return
    }

    const newEntry: TimetableEntry = {
      dayOfWeek: selectedDay,
      periodNumber: Number(periodNumber),
      startTime,
      endTime,
      subjectName,
      teacherName: teacherName || undefined,
      room: room || undefined,
    }

    setEntries([...entries, newEntry])
    setPeriodNumber(prev => prev + 1)
    toast.success(`Period added to ${selectedDay} schedule!`)
  }

  const handleRemovePeriod = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
    toast.info('Period removed.')
  }

  const handleSaveTimetable = async () => {
    setSaving(true)
    try {
      const res = await saveTimetableAction({
        className,
        entries
      })

      if (res.success) {
        toast.success(`Class Timetable for ${className} saved to Supabase DB in real time!`)
      } else {
        toast.error(res.error || 'Failed to save timetable.')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while saving timetable.')
    } finally {
      setSaving(false)
    }
  }

  const dayEntries = entries.filter(e => e.dayOfWeek === selectedDay)

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <Link href="/dashboard/teacher/my-classes" className="inline-flex items-center text-xs font-bold text-purple-600 hover:text-purple-700 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Classes
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Class Timetable Manager</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Create and publish weekly academic schedule for <span className="font-bold text-purple-600">{className}</span> in real time.
            </p>
          </div>

          <Button
            onClick={handleSaveTimetable}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black h-12 px-6 rounded-2xl shadow-lg shadow-purple-600/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>SAVE REAL-TIME TIMETABLE</span>
          </Button>
        </div>

        {/* Day Selector */}
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-3 rounded-2xl font-black text-xs transition ${
                selectedDay === day
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Period Form */}
          <Card className="border-none shadow-xl rounded-3xl bg-white p-6 space-y-5">
            <CardHeader className="p-0 pb-2 border-b border-slate-100">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" /> Add Period to {selectedDay}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Period #</Label>
                  <Input
                    type="number"
                    value={periodNumber}
                    onChange={e => setPeriodNumber(Number(e.target.value))}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Room / Venue</Label>
                  <Input
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Subject Name *</Label>
                <Input
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Instructor Name (Optional)</Label>
                <Input
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  placeholder="e.g. Mr. Okonkwo"
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                />
              </div>

              <Button
                onClick={handleAddPeriod}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black h-12 rounded-xl text-xs"
              >
                ADD PERIOD TO SCHEDULE
              </Button>
            </CardContent>
          </Card>

          {/* Schedule List for Selected Day */}
          <Card className="lg:col-span-2 border-none shadow-xl rounded-3xl bg-white p-6 space-y-5">
            <CardHeader className="p-0 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" /> {selectedDay} Schedule ({dayEntries.length} periods)
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-400">
                  Live periods published for students of {className}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              {loading ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs">Loading timetable...</div>
              ) : dayEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium italic text-xs">
                  No periods scheduled for {selectedDay} yet. Use the form on the left to add periods.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEntries.map((entry, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                          P{entry.periodNumber}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{entry.subjectName}</p>
                          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {entry.startTime} - {entry.endTime}
                            {entry.teacherName && <span>• {entry.teacherName}</span>}
                            {entry.room && <span>• {entry.room}</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePeriod(entries.indexOf(entry))}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
