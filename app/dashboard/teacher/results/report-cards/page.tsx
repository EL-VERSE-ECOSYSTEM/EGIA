'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, CheckCircle, FileSpreadsheet, Loader2 } from 'lucide-react'
import { getReportCards, saveReportCard, ReportCard } from '@/app/actions/report-cards'

export default function TeacherReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form State
  const [studentName, setStudentName] = useState('')
  const [className, setClassName] = useState('Primary 3')
  const [studentId, setStudentId] = useState('')
  const [teacherRemarks, setTeacherRemarks] = useState('')
  const [subjectRows, setSubjectRows] = useState<{ subject: string; testScore: number; examScore: number }[]>([
    { subject: 'Mathematics', testScore: 0, examScore: 0 },
    { subject: 'English Language', testScore: 0, examScore: 0 }
  ])

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const cards = await getReportCards()
      setReportCards(cards)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addSubjectRow = () => {
    setSubjectRows([...subjectRows, { subject: '', testScore: 0, examScore: 0 }])
  }

  const removeSubjectRow = (idx: number) => {
    setSubjectRows(subjectRows.filter((_, i) => i !== idx))
  }

  const handleRowChange = (idx: number, field: string, value: any) => {
    const updated = [...subjectRows]
    updated[idx] = { ...updated[idx], [field]: value }
    setSubjectRows(updated)
  }

  const handleCreateReportCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentName.trim()) return alert('Please enter student name')
    setSaving(true)

    const mappedMarks = subjectRows.map(row => {
      const total = Number(row.testScore) + Number(row.examScore)
      let grade = 'F'
      if (total >= 80) grade = 'A'
      else if (total >= 70) grade = 'B'
      else if (total >= 60) grade = 'C'
      else if (total >= 50) grade = 'D'
      else if (total >= 40) grade = 'E'

      return {
        subject: row.subject,
        testScore: Number(row.testScore),
        examScore: Number(row.examScore),
        total,
        grade
      }
    })

    try {
      await saveReportCard({
        studentId: studentId || `stud-${Date.now()}`,
        studentName,
        className,
        marks: mappedMarks,
        teacherRemarks
      })

      alert('Report Card submitted successfully for Admin endorsement!')
      setStudentName('')
      setStudentId('')
      setTeacherRemarks('')
      setSubjectRows([
        { subject: 'Mathematics', testScore: 0, examScore: 0 },
        { subject: 'English Language', testScore: 0, examScore: 0 }
      ])
      fetchCards()
    } catch (err) {
      console.error(err)
      alert('Failed to submit report card')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Report Cards</h1>
          <p className="text-slate-500 text-lg font-medium">
             Generate comprehensive term report cards for students and submit to Admin for endorsement.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black text-slate-900">Compile Report Card</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Input Continuous Assessment and Exam marks</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleCreateReportCard} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Student Full Name</Label>
                    <Input
                      placeholder="e.g. Amina Bello"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      required
                      className="h-12 rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Class</Label>
                    <select
                      value={className}
                      onChange={e => setClassName(e.target.value)}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 font-bold text-slate-800"
                    >
                      <option value="Primary 3">Primary 3</option>
                      <option value="Primary 4">Primary 4</option>
                      <option value="Primary 5">Primary 5</option>
                      <option value="Primary 6">Primary 6</option>
                      <option value="JSS 1">JSS 1</option>
                      <option value="JSS 2">JSS 2</option>
                      <option value="JSS 3">JSS 3</option>
                      <option value="SSS 1">SSS 1</option>
                      <option value="SSS 2">SSS 2</option>
                      <option value="SSS 3">SSS 3</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Subject Grades & Performance</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSubjectRow} className="rounded-xl border-slate-200 font-bold">
                      <Plus className="w-4 h-4 mr-1" /> Add Subject
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {subjectRows.map((row, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <Input
                          placeholder="e.g. Mathematics"
                          value={row.subject}
                          onChange={e => handleRowChange(idx, 'subject', e.target.value)}
                          required
                          className="h-12 rounded-xl border-slate-200 flex-grow font-bold"
                        />
                        <div className="w-24">
                          <Input
                            type="number"
                            placeholder="Test (30)"
                            value={row.testScore}
                            onChange={e => handleRowChange(idx, 'testScore', e.target.value)}
                            required
                            max={30}
                            min={0}
                            className="h-12 rounded-xl border-slate-200 font-bold text-center"
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            placeholder="Exam (70)"
                            value={row.examScore}
                            onChange={e => handleRowChange(idx, 'examScore', e.target.value)}
                            required
                            max={70}
                            min={0}
                            className="h-12 rounded-xl border-slate-200 font-bold text-center"
                          />
                        </div>
                        {subjectRows.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSubjectRow(idx)} className="text-slate-400 hover:text-red-500 rounded-xl">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Teacher Remarks</Label>
                  <Input
                    placeholder="e.g. Very focused student. Excellent results."
                    value={teacherRemarks}
                    onChange={e => setTeacherRemarks(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 font-bold"
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-14 rounded-2xl font-black text-lg">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit for Admin Endorsement'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
            <h3 className="text-xl font-black text-slate-900 mb-6">Recent Reports Status</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="text-slate-400 font-bold py-10 text-center">Loading status...</div>
              ) : reportCards.length === 0 ? (
                <div className="text-slate-400 font-bold py-10 text-center">No report cards logged yet</div>
              ) : (
                reportCards.map((c) => (
                  <div key={c.id} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-sm text-slate-900">{c.studentName}</p>
                      <Badge className={
                        c.status === 'ENDORSED' ? 'bg-emerald-50 text-emerald-700 border-none font-bold' :
                        c.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-none font-bold' :
                        'bg-amber-50 text-amber-700 border-none font-bold'
                      }>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase">{c.className}</p>
                    {c.adminFeedback && (
                      <p className="text-xs font-bold text-slate-500 bg-white p-3 rounded-xl border border-slate-100 mt-2">
                        <span className="font-black text-slate-700">Admin: </span>{c.adminFeedback}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
