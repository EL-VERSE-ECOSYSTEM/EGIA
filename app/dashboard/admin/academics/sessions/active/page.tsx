'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowRight, Settings2, Plus, Loader2, X, AlertCircle } from 'lucide-react'
import { getAcademicSessions, getTerms, createAcademicSession, createTerm } from '@/app/actions/admin'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function AcademicSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals visibility
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showTermModal, setShowTermModal] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')

  // Form states
  const [sessionName, setSessionName] = useState('')
  const [sessionStart, setSessionStart] = useState('')
  const [sessionEnd, setSessionEnd] = useState('')
  const [isSubmittingSession, setIsSubmittingSession] = useState(false)

  const [termName, setTermName] = useState('First Term')
  const [termStart, setTermStart] = useState('')
  const [termEnd, setTermEnd] = useState('')
  const [isSubmittingTerm, setIsSubmittingTerm] = useState(false)

  const loadData = async () => {
    try {
      const fetchedSessions = await getAcademicSessions()
      const fetchedTerms = await getTerms()
      setSessions(fetchedSessions)
      setTerms(fetchedTerms)
    } catch (err: any) {
      toast.error('Failed to load academic sessions', { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Subscribe to real-time changes in academic_session & term tables
  useRealtimeSubscription('academic_session', () => {
    loadData()
    toast.success('Sessions list synced in real-time')
  })

  useRealtimeSubscription('term', () => {
    loadData()
    toast.success('Terms list synced in real-time')
  })

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName || !sessionStart || !sessionEnd) {
      toast.error('Please fill in all session fields')
      return
    }

    setIsSubmittingSession(true)
    try {
      await createAcademicSession(sessionName, sessionStart, sessionEnd)
      toast.success('Academic Session created successfully!')
      setShowSessionModal(false)
      setSessionName('')
      setSessionStart('')
      setSessionEnd('')
      await loadData()
    } catch (err: any) {
      toast.error('Failed to create session', { description: err.message })
    } finally {
      setIsSubmittingSession(false)
    }
  }

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSessionId || !termName || !termStart || !termEnd) {
      toast.error('Please fill in all term fields')
      return
    }

    setIsSubmittingTerm(true)
    try {
      await createTerm(selectedSessionId, termName, termStart, termEnd)
      toast.success('Term created and linked successfully!')
      setShowTermModal(false)
      setTermStart('')
      setTermEnd('')
      await loadData()
    } catch (err: any) {
      toast.error('Failed to create term', { description: err.message })
    } finally {
      setIsSubmittingTerm(false)
    }
  }

  // Helper to filter terms belonging to a session
  const getTermsForSession = (sessionId: string) => {
    return terms.filter((t) => t.sessionId === sessionId)
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Sessions & Terms</h1>
            <p className="text-slate-500 font-medium text-lg">Manage the school calendar and academic timeline with live database synchronization.</p>
          </div>
          <Button
            onClick={() => setShowSessionModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-amber-950 h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-amber-200 flex items-center gap-2"
          >
            <Plus className="w-6 h-6" /> Start New Session
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            <p className="text-slate-500 font-bold">Querying live academic timeline...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white p-12 text-center">
            <CardContent className="space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">No Academic Sessions Yet</h2>
              <p className="text-slate-500 font-medium">
                Create your first academic session to set up the terms, enroll students, and record grades.
              </p>
              <Button
                onClick={() => setShowSessionModal(true)}
                className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-6 py-3 rounded-xl"
              >
                Create New Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sessions.map((s) => {
              const sessionTerms = getTermsForSession(s.id)
              return (
                <Card key={s.id} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      <div className={`p-10 lg:w-1/3 flex flex-col justify-center ${s.isCurrent ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-900'}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge className={`border-none px-3 py-1 font-black text-[10px] uppercase ${s.isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {s.isCurrent ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                        <h3 className="text-3xl font-black leading-tight mb-4">{s.name}</h3>
                        <div className="space-y-2 opacity-80 font-bold text-sm">
                          <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Start: {s.startDate}</p>
                          <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> End: {s.endDate}</p>
                          <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {sessionTerms.length} Terms Configured</p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedSessionId(s.id)
                            setShowTermModal(true)
                          }}
                          className={`mt-6 rounded-xl font-bold ${s.isCurrent ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Term
                        </Button>
                      </div>
                      <div className="p-10 flex-1 flex flex-col justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                          {sessionTerms.length > 0 ? (
                            sessionTerms.map((t, idx) => (
                              <div key={t.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Term {idx + 1}</p>
                                <p className="font-black text-slate-900 mb-2">{t.name}</p>
                                <p className="text-xs text-slate-500 font-bold mb-4">{t.startDate} - {t.endDate}</p>
                                <div className="flex items-center justify-between">
                                  <Badge className="text-[10px] border-none bg-emerald-100 text-emerald-700 font-black px-2.5 py-0.5">
                                    Configured
                                  </Badge>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-400 font-bold text-sm">
                              No terms configured for this academic session yet.
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" className="rounded-xl h-12 font-bold px-6 border-2">Session Settings</Button>
                          <Button className="rounded-xl h-12 font-black px-6 bg-slate-900 text-white flex items-center gap-2">
                            View Full Calendar <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Session Modal */}
        {showSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-lg border-none shadow-2xl rounded-3xl bg-white overflow-hidden animate-in zoom-in duration-200">
              <CardHeader className="bg-slate-900 text-white p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black">Create Academic Session</CardTitle>
                  <p className="text-xs font-bold text-slate-400 mt-1">Add a new academic timeline to the academy roster</p>
                </div>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleCreateSession} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Session Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026/2027"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={sessionStart}
                        onChange={(e) => setSessionStart(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">End Date</label>
                      <input
                        type="date"
                        value={sessionEnd}
                        onChange={(e) => setSessionEnd(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSessionModal(false)}
                      className="rounded-xl h-12 font-bold px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingSession}
                      className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-xl h-12 px-6 shadow-lg shadow-amber-200"
                    >
                      {isSubmittingSession ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating...</span>
                      ) : 'Create Session'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Term Modal */}
        {showTermModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-lg border-none shadow-2xl rounded-3xl bg-white overflow-hidden animate-in zoom-in duration-200">
              <CardHeader className="bg-slate-900 text-white p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black">Configure Session Term</CardTitle>
                  <p className="text-xs font-bold text-slate-400 mt-1">Bind a new term period to this academic session</p>
                </div>
                <button
                  onClick={() => setShowTermModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleCreateTerm} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Term Name</label>
                    <select
                      value={termName}
                      onChange={(e) => setTermName(e.target.value)}
                      className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:border-amber-500 bg-white"
                      required
                    >
                      <option value="First Term">First Term</option>
                      <option value="Second Term">Second Term</option>
                      <option value="Third Term">Third Term</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={termStart}
                        onChange={(e) => setTermStart(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-wider">End Date</label>
                      <input
                        type="date"
                        value={termEnd}
                        onChange={(e) => setTermEnd(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTermModal(false)}
                      className="rounded-xl h-12 font-bold px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingTerm}
                      className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-xl h-12 px-6 shadow-lg shadow-amber-200"
                    >
                      {isSubmittingTerm ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Adding...</span>
                      ) : 'Add Term'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
