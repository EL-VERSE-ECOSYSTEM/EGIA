'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import {
  getReportCards,
  getReportCardStudents,
  getTeacherReportCardTargets,
  saveReportCard,
  type ReportCard,
  type ReportCardScore,
} from '@/app/actions/report-cards'
import { toast } from 'sonner'

type SubjectRow = {
  subject: string
  testScore: number
  examScore: number
  otherScores: ReportCardScore[]
}

export default function TeacherReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [targets, setTargets] = useState<Awaited<ReturnType<typeof getTeacherReportCardTargets>>>([])
  const [students, setStudents] = useState<Awaited<ReturnType<typeof getReportCardStudents>>>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [teacherRemarks, setTeacherRemarks] = useState('')
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)

  const classOptions = useMemo(() => {
    const classes = new Map<string, string>()
    for (const target of targets) classes.set(target.classId, target.className)
    return [...classes].map(([id, name]) => ({ id, name }))
  }, [targets])

  const availableSubjects = useMemo(
    () => targets.filter((target) => target.classId === selectedClassId),
    [targets, selectedClassId],
  )

  const fetchCards = async () => {
    const cards = await getReportCards()
    setReportCards(cards)
  }

  useEffect(() => {
    Promise.all([getReportCards(), getTeacherReportCardTargets()])
      .then(([cards, teacherTargets]) => {
        setReportCards(cards)
        setTargets(teacherTargets)
        if (teacherTargets[0]) {
          setSelectedClassId(teacherTargets[0].classId)
          setSubjectRows(teacherTargets
            .filter((target) => target.classId === teacherTargets[0].classId)
            .map((target) => ({ subject: target.subjectName, testScore: 0, examScore: 0, otherScores: [] })))
          return getReportCardStudents(teacherTargets[0].classId)
        }
        return []
      })
      .then((roster) => setStudents(roster))
      .catch((error: unknown) => {
        console.error('Could not load report-card setup:', error)
        toast.error(error instanceof Error ? error.message : 'Could not load your assigned classes.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId)
    setStudentId('')
    setLoadingStudents(true)
    setSubjectRows(targets
      .filter((target) => target.classId === classId)
      .map((target) => ({ subject: target.subjectName, testScore: 0, examScore: 0, otherScores: [] })))
    try {
      setStudents(await getReportCardStudents(classId))
    } catch (error) {
      setStudents([])
      toast.error(error instanceof Error ? error.message : 'Could not load the assigned class roster.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const addSubjectRow = () => setSubjectRows((rows) => [...rows, {
    subject: '',
    testScore: 0,
    examScore: 0,
    otherScores: [],
  }])

  const updateSubject = (index: number, patch: Partial<SubjectRow>) => {
    setSubjectRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }

  const addOtherScore = (rowIndex: number) => {
    setSubjectRows((rows) => rows.map((row, index) => index === rowIndex
      ? { ...row, otherScores: [...row.otherScores, { label: '', score: 0, maxScore: 10 }] }
      : row))
  }

  const updateOtherScore = (rowIndex: number, scoreIndex: number, patch: Partial<ReportCardScore>) => {
    setSubjectRows((rows) => rows.map((row, index) => index === rowIndex
      ? {
          ...row,
          otherScores: row.otherScores.map((score, itemIndex) =>
            itemIndex === scoreIndex ? { ...score, ...patch } : score),
        }
      : row))
  }

  const handleCreateReportCard = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedClassId || !studentId) {
      toast.error('Choose an assigned class and student.')
      return
    }
    if (subjectRows.some((row) => !row.subject)) {
      toast.error('Choose an assigned subject for each score row.')
      return
    }
    setSaving(true)
    try {
      await saveReportCard({
        studentId,
        marks: subjectRows,
        teacherRemarks,
      })
      toast.success('Report card submitted for school-admin approval.')
      setTeacherRemarks('')
      setSubjectRows(availableSubjects.map((target) => ({
        subject: target.subjectName, testScore: 0, examScore: 0, otherScores: [],
      })))
      await fetchCards()
    } catch (error) {
      console.error('Could not submit report card:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit report card.')
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
            Enter scores only for your assigned students and subjects. School administration must approve each report before families can view it.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black text-slate-900">Compile Report Card</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Enter continuous assessment, exam, and any additional score sections.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleCreateReportCard} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-class">Assigned class</Label>
                    <select id="report-class" value={selectedClassId} onChange={(event) => void handleClassChange(event.target.value)} required
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800">
                      {classOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="report-student">Student</Label>
                    <select id="report-student" value={studentId} onChange={(event) => setStudentId(event.target.value)} required disabled={loadingStudents || !students.length}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800 disabled:opacity-50">
                      <option value="">{loadingStudents ? 'Loading class roster…' : 'Select a student'}</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {[student.name, student.middleName, student.lastName].filter(Boolean).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {classOptions.length === 0 && !loading && (
                  <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">No classes and subjects are assigned to your teacher account.</p>
                )}

                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Subject Scores</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSubjectRow} className="rounded-xl border-slate-200 font-bold">
                      <Plus className="w-4 h-4 mr-1" /> Add Subject
                    </Button>
                  </div>

                  {subjectRows.map((row, rowIndex) => (
                    <div key={`${row.subject}-${rowIndex}`} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem_auto] gap-2 items-center">
                        <select value={row.subject} onChange={(event) => updateSubject(rowIndex, { subject: event.target.value })} required
                          className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800">
                          <option value="">Select assigned subject</option>
                          {availableSubjects.map((target) => <option key={target.subjectId} value={target.subjectName}>{target.subjectName}</option>)}
                        </select>
                        <Input aria-label="Test score out of 30" type="number" placeholder="Test /30" value={row.testScore} min={0} max={30} step="0.5"
                          onChange={(event) => updateSubject(rowIndex, { testScore: Number(event.target.value) })} required className="h-11 px-2 text-center" />
                        <Input aria-label="Exam score out of 70" type="number" placeholder="Exam /70" value={row.examScore} min={0} max={70} step="0.5"
                          onChange={(event) => updateSubject(rowIndex, { examScore: Number(event.target.value) })} required className="h-11 px-2 text-center" />
                        {subjectRows.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove subject" onClick={() => setSubjectRows((rows) => rows.filter((_, index) => index !== rowIndex))}><Trash2 className="w-4 h-4 text-rose-500" /></Button>}
                      </div>
                      <div className="space-y-2 pl-1">
                        {row.otherScores.map((score, scoreIndex) => (
                          <div key={scoreIndex} className="grid grid-cols-[minmax(0,1fr)_5rem_5rem_auto] gap-2">
                            <Input aria-label="Additional score section name" placeholder="e.g. Project" value={score.label}
                              onChange={(event) => updateOtherScore(rowIndex, scoreIndex, { label: event.target.value })} required className="h-10" />
                            <Input aria-label="Additional score" type="number" value={score.score} min={0} max={score.maxScore} step="0.5"
                              onChange={(event) => updateOtherScore(rowIndex, scoreIndex, { score: Number(event.target.value) })} required className="h-10 px-2 text-center" />
                            <Input aria-label="Additional score maximum" type="number" value={score.maxScore} min={1} max={100}
                              onChange={(event) => updateOtherScore(rowIndex, scoreIndex, { maxScore: Number(event.target.value) })} required className="h-10 px-2 text-center" />
                            <Button type="button" variant="ghost" size="icon" aria-label="Remove additional score" onClick={() => updateSubject(rowIndex, { otherScores: row.otherScores.filter((_, index) => index !== scoreIndex) })}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" onClick={() => addOtherScore(rowIndex)} className="font-bold text-indigo-700">
                          <Plus className="w-4 h-4 mr-1" /> Add score section
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-remarks">Teacher remarks</Label>
                  <Input id="teacher-remarks" placeholder="Learning progress and next steps" value={teacherRemarks}
                    onChange={(event) => setTeacherRemarks(event.target.value)} required maxLength={2000}
                    className="h-12 rounded-xl border-slate-200 font-semibold" />
                </div>

                <Button type="submit" disabled={saving || loading || !classOptions.length} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-14 rounded-2xl font-black text-lg">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit for Admin Approval'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
            <h3 className="text-xl font-black text-slate-900 mb-6">Recent Reports Status</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="text-slate-400 font-bold py-10 text-center">Loading status…</div>
              ) : reportCards.length === 0 ? (
                <div className="text-slate-400 font-bold py-10 text-center">No report cards logged yet</div>
              ) : reportCards.map((card) => (
                <div key={card.id} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-black text-sm text-slate-900">{card.studentName}</p>
                    <Badge className={
                      card.status === 'ENDORSED' ? 'bg-emerald-50 text-emerald-700 border-none font-bold' :
                      card.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-none font-bold' :
                      'bg-amber-50 text-amber-700 border-none font-bold'
                    }>{card.status}</Badge>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{card.className} · {card.term} · {card.session}</p>
                  {card.adminFeedback && <p className="text-xs font-semibold text-slate-600 bg-white p-3 rounded-xl border border-slate-100"><span className="font-black text-slate-700">Admin: </span>{card.adminFeedback}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
