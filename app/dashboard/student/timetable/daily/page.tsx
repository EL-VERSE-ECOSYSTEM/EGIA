'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar, Clock, BookOpen, RefreshCw } from 'lucide-react'
import { getTimetableAction } from '@/app/actions/timetable'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function StudentDailyTimetablePage() {
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [studentClass, setStudentClass] = useState('SSS 2')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadStudentTimetable = async () => {
    setLoading(true)
    const res = await getTimetableAction(studentClass)
    if (res.success && res.entries) {
      setEntries(res.entries)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadStudentTimetable()
  }, [studentClass])

  const dayEntries = entries.filter(e => e.dayOfWeek === selectedDay)

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-5xl mx-auto space-y-8 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-black uppercase mb-2">
              <Calendar className="w-3.5 h-3.5" /> ACADEMIC TIMETABLE
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daily Class Timetable</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Live scheduled periods and subject lectures published by your Class Teacher.
            </p>
          </div>

          <button
            onClick={loadStudentTimetable}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-2 text-xs"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Schedule
          </button>
        </div>

        {/* Day Selector */}
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-3 rounded-2xl font-black text-xs transition ${
                selectedDay === day
                  ? 'bg-amber-500 text-amber-950 shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        <Card className="border-none shadow-xl rounded-3xl bg-white p-6 space-y-5">
          <CardHeader className="p-0 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> {selectedDay} Schedule ({dayEntries.length} periods)
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-400">
                Official time slots for {studentClass}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs">Loading live timetable from Supabase DB...</div>
            ) : dayEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium italic text-xs">
                No classes scheduled for {selectedDay}. Enjoy your study or break period!
              </div>
            ) : (
              <div className="space-y-3">
                {dayEntries.map((entry, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-amber-950 font-black text-base flex items-center justify-center shadow-md">
                        P{entry.periodNumber}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-base">{entry.subjectName}</p>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> {entry.startTime} - {entry.endTime}
                          {entry.teacherName && <span>• Instructor: {entry.teacherName}</span>}
                          {entry.room && <span>• Venue: {entry.room}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
