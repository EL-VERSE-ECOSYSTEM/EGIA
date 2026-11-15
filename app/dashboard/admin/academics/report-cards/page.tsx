'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Check, X, Award, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import {
  getReportCards,
  endorseReportCard,
  rejectReportCard,
  updateReportCardScores,
  type ReportCard,
  type ReportCardMark,
  type ReportCardScore,
} from '@/app/actions/report-cards'

export default function AdminReportCardsPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({})
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedMarks, setEditedMarks] = useState<Record<string, ReportCardMark[]>>({})

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

  const handleEndorse = async (id: string) => {
    setProcessing(prev => ({ ...prev, [id]: true }))
    try {
      await endorseReportCard(id, feedback[id] || 'Endorsed and approved by Academy Administration.')
      alert('Report card successfully endorsed and published!')
      fetchCards()
    } catch (err) {
      console.error(err)
      alert('Failed to endorse report card')
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleReject = async (id: string) => {
    if (!feedback[id]?.trim()) {
      return alert('Please enter feedback explaining the reason for rejection.')
    }
    setProcessing(prev => ({ ...prev, [id]: true }))
    try {
      await rejectReportCard(id, feedback[id])
      alert('Report card returned to teacher with feedback.')
      fetchCards()
    } catch (err) {
      console.error(err)
      alert('Failed to reject report card')
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }))
    }
  }

  const startEditing = (card: ReportCard) => {
    setEditedMarks((current) => ({
      ...current,
      [card.id]: card.marks.map((mark) => ({
        ...mark,
        otherScores: (mark.otherScores || []).map((score) => ({ ...score })),
      })),
    }))
    setEditingId(card.id)
  }

  const updateMark = (cardId: string, markIndex: number, patch: Partial<ReportCardMark>) => {
    setEditedMarks((current) => ({
      ...current,
      [cardId]: current[cardId].map((mark, index) => index === markIndex ? { ...mark, ...patch } : mark),
    }))
  }

  const updateOtherScore = (cardId: string, markIndex: number, scoreIndex: number, patch: Partial<ReportCardScore>) => {
    const mark = editedMarks[cardId][markIndex]
    updateMark(cardId, markIndex, {
      otherScores: (mark.otherScores || []).map((score, index) => index === scoreIndex ? { ...score, ...patch } : score),
    })
  }

  const addOtherScore = (cardId: string, markIndex: number) => {
    const mark = editedMarks[cardId][markIndex]
    updateMark(cardId, markIndex, {
      otherScores: [...(mark.otherScores || []), { label: '', score: 0, maxScore: 10 }],
    })
  }

  const saveScores = async (id: string) => {
    setProcessing((current) => ({ ...current, [id]: true }))
    try {
      const updated = await updateReportCardScores(id, editedMarks[id])
      setReportCards((current) => current.map((card) => card.id === id ? updated : card))
      setEditingId(null)
      setEditedMarks((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      alert('Scores saved and report card returned to pending approval.')
    } catch (error) {
      console.error('Could not update report-card scores:', error)
      alert(error instanceof Error ? error.message : 'Failed to update report-card scores.')
    } finally {
      setProcessing((current) => ({ ...current, [id]: false }))
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Report Card Endorsement</h1>
          <p className="text-slate-500 text-lg font-medium">
             Review and endorse term report cards submitted by teachers before publishing them to parents/students.
          </p>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-slate-400 font-bold py-10 text-center">Loading pending report cards...</div>
          ) : reportCards.length === 0 ? (
            <div className="text-slate-400 font-bold py-10 text-center">No report cards logged yet</div>
          ) : (
            reportCards.map((c) => (
              <Card key={c.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <div className="h-2 bg-slate-900 w-full" />
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-50 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{c.studentName}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{c.className} • {c.term} • {c.session}</p>
                    </div>
                    <Badge className={
                      c.status === 'ENDORSED' ? 'bg-emerald-50 text-emerald-700 border-none font-bold px-4 py-1.5' :
                      c.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-none font-bold px-4 py-1.5' :
                      'bg-amber-50 text-amber-700 border-none font-bold px-4 py-1.5'
                    }>
                      {c.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-black text-sm uppercase tracking-wider text-slate-400">Subject Performance</h4>
                        {editingId !== c.id && (
                          <Button type="button" variant="outline" size="sm" onClick={() => startEditing(c)} className="rounded-xl font-bold">
                            <Pencil className="mr-1 h-4 w-4" /> Edit scores
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(editingId === c.id ? editedMarks[c.id] : c.marks).map((m, idx) => (
                          <div key={`${m.subject}-${idx}`} className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex flex-wrap justify-between items-center gap-3">
                              <p className="font-bold text-slate-800">{m.subject}</p>
                              {editingId === c.id ? (
                                <div className="flex items-center gap-2">
                                  <Input aria-label={`${m.subject} test score`} type="number" min={0} max={30} step="0.5"
                                    value={m.testScore} onChange={(event) => updateMark(c.id, idx, { testScore: Number(event.target.value) })}
                                    className="h-9 w-24 text-center" />
                                  <Input aria-label={`${m.subject} exam score`} type="number" min={0} max={70} step="0.5"
                                    value={m.examScore} onChange={(event) => updateMark(c.id, idx, { examScore: Number(event.target.value) })}
                                    className="h-9 w-24 text-center" />
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 font-bold">Test: {m.testScore}/30 | Exam: {m.examScore}/70</p>
                              )}
                            </div>
                            {(m.otherScores || []).map((score, scoreIndex) => (
                              <div key={scoreIndex} className="grid grid-cols-[minmax(0,1fr)_5rem_5rem_auto] gap-2 items-center">
                                {editingId === c.id ? (
                                  <>
                                    <Input aria-label="Score section name" value={score.label} maxLength={60}
                                      onChange={(event) => updateOtherScore(c.id, idx, scoreIndex, { label: event.target.value })} />
                                    <Input aria-label="Section score" type="number" min={0} max={score.maxScore}
                                      value={score.score} onChange={(event) => updateOtherScore(c.id, idx, scoreIndex, { score: Number(event.target.value) })} />
                                    <Input aria-label="Section maximum" type="number" min={1} max={100}
                                      value={score.maxScore} onChange={(event) => updateOtherScore(c.id, idx, scoreIndex, { maxScore: Number(event.target.value) })} />
                                    <Button type="button" variant="ghost" size="icon" aria-label="Remove score section"
                                      onClick={() => updateMark(c.id, idx, { otherScores: (m.otherScores || []).filter((_, index) => index !== scoreIndex) })}>
                                      <Trash2 className="h-4 w-4 text-rose-500" />
                                    </Button>
                                  </>
                                ) : (
                                  <p className="col-span-4 text-xs text-slate-500 font-semibold">{score.label}: {score.score}/{score.maxScore}</p>
                                )}
                              </div>
                            ))}
                            {editingId === c.id && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => addOtherScore(c.id, idx)} className="font-bold text-indigo-700">
                                <Plus className="mr-1 h-4 w-4" /> Add score section
                              </Button>
                            )}
                            <div className="flex justify-end items-center gap-3">
                              <p className="font-black text-slate-950">Total: {m.total}</p>
                              <Badge className="bg-slate-900 text-white font-black rounded-lg text-xs">{m.grade}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      {editingId === c.id && (
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button type="button" onClick={() => void saveScores(c.id)} disabled={processing[c.id]} className="bg-indigo-700 text-white hover:bg-indigo-800">
                            {processing[c.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1 h-4 w-4" /> Save scores</>}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-black text-sm uppercase tracking-wider text-slate-400">Teacher Remarks</h4>
                      <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-2xl italic font-semibold text-purple-950 leading-relaxed">
                        "{c.teacherRemarks}"
                      </div>
                    </div>
                  </div>

                  {c.status === 'PENDING' ? (
                    <div className="mt-8 border-t border-slate-50 pt-6 space-y-4">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Review Comments / Endorsement Feedback</Label>
                      <div className="flex gap-4">
                        <Input
                          placeholder="Provide feedback or leave blank for default endorsement."
                          value={feedback[c.id] || ''}
                          onChange={e => setFeedback({ ...feedback, [c.id]: e.target.value })}
                          className="h-12 rounded-xl border-slate-200"
                        />
                        <Button
                          onClick={() => handleEndorse(c.id)}
                          disabled={processing[c.id]}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-6 rounded-xl flex items-center gap-1 shrink-0"
                        >
                          {processing[c.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Endorse</>}
                        </Button>
                        <Button
                          onClick={() => handleReject(c.id)}
                          disabled={processing[c.id]}
                          className="bg-red-600 hover:bg-red-700 text-white font-black h-12 px-6 rounded-xl flex items-center gap-1 shrink-0"
                        >
                          {processing[c.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <><X className="w-5 h-5" /> Reject</>}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2">
                      <Award className="text-amber-500 w-5 h-5" />
                      <p className="text-xs font-bold text-slate-600">
                        <span className="font-black text-slate-900">Admin Endorsement Note: </span>
                        {c.adminFeedback || 'Report card successfully published.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
