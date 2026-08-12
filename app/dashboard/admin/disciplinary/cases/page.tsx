'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldAlert, Plus, CheckCircle, Scale, Calendar, AlertOctagon } from 'lucide-react'
import { getAdminDisciplinaryRecords, createDisciplinaryRecord, resolveDisciplinaryRecord } from '@/app/actions/admin-ops'
import { getAllStudents } from '@/app/actions/admin'
import { toast } from 'sonner'

export default function AdminDisciplinaryCasesPage() {
  const [cases, setCases] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  // Form states
  const [studentId, setStudentId] = useState('')
  const [incidentType, setIncidentType] = useState('Academic Dishonesty')
  const [description, setDescription] = useState('')
  const [sanction, setSanction] = useState('')
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      const list = await getAdminDisciplinaryRecords()
      setCases(list || [])
      const std = await getAllStudents()
      setStudents(std || [])
      if (std && std.length > 0) {
        setStudentId(std[0].id)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !description) return toast.error('Please select a student and describe the incident.')

    setSubmitting(true)
    try {
      await createDisciplinaryRecord({
        studentId,
        incidentType,
        description,
        sanction: sanction || undefined
      })
      toast.success('Disciplinary incident reported successfully!')
      setDescription('')
      setSanction('')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (id: string) => {
    const notes = resolveNotes[id] || ''
    if (!notes) return toast.error('Please input resolution remarks.')

    setResolvingId(id)
    try {
      await resolveDisciplinaryRecord(id, notes)
      toast.success('Disciplinary case resolved!')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Disciplinary Incident Desk</h1>
          <p className="text-slate-500 font-medium text-lg">Record infractions, assign correct sanctions, and manage administrative resolutions in real-time.</p>
        </div>

        {loading ? (
          <div className="p-24 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing case logs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Report Form */}
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white overflow-hidden h-fit">
              <CardHeader className="bg-red-950 text-white p-8">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Report Infraction
                </CardTitle>
                <CardDescription className="text-red-300">File a new disciplinary incident case</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Involved Learner</Label>
                    <select
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-800"
                      required
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.admissionNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Incident Category</Label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-800"
                    >
                      <option value="Academic Dishonesty">Academic Dishonesty</option>
                      <option value="Bullying / Conduct Unbecoming">Bullying / Conduct Unbecoming</option>
                      <option value="Vandalism or Damage">Vandalism or Damage</option>
                      <option value="Chronic Absenteeism / Lateness">Chronic Absenteeism / Lateness</option>
                      <option value="Other Policy Infraction">Other Policy Infraction</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Incident Details</Label>
                    <textarea
                      placeholder="Describe the incident, date, and context clearly..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="w-full min-h-[90px] p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Proposed Sanction / Action</Label>
                    <Input
                      placeholder="e.g. 2-Day Suspension / Detention"
                      value={sanction}
                      onChange={(e) => setSanction(e.target.value)}
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-red-700 hover:bg-red-800 text-white h-12 rounded-xl font-black text-xs flex items-center justify-center gap-2 mt-4"
                  >
                    {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <AlertOctagon size={16} />}
                    RECORD INFRACTION
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Cases List */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-black text-slate-900 ml-2">Active Incident Ledger</h3>
              {cases.length === 0 ? (
                <div className="p-16 bg-white border border-slate-100 rounded-[2.5rem] text-center text-slate-400">
                  <p className="font-black text-lg">No infractions recorded in system cache.</p>
                  <p className="text-sm font-medium mt-1">Excellent conduct! All academic records are clean.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cases.map((cs) => (
                    <Card key={cs.id} className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-800 border-none font-black text-[9px] tracking-wide rounded uppercase px-2.5 py-1">
                              {cs.incident_type}
                            </Badge>
                            {cs.status === 'PENDING' ? (
                              <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[9px] tracking-wide rounded px-2.5 py-1 animate-pulse">
                                Awaiting Action
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[9px] tracking-wide rounded px-2.5 py-1">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-black text-lg text-slate-900 leading-tight">
                            {cs.student_name} <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">({cs.admissionnumber})</span>
                          </h4>
                          <p className="text-slate-500 text-xs font-semibold leading-relaxed">{cs.description}</p>

                          {cs.sanction && (
                            <p className="text-xs font-bold text-red-600">Assigned Sanction: <span className="font-semibold underline">{cs.sanction}</span></p>
                          )}

                          {cs.status === 'RESOLVED' && cs.notes && (
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 leading-relaxed max-w-2xl mt-2">
                              <b>Resolution Remarks:</b> {cs.notes}
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center shrink-0 min-w-[120px] text-[10px] space-y-1">
                          <p className="text-slate-400 font-black uppercase tracking-wider">Filed By</p>
                          <p className="font-bold text-slate-700">{cs.reported_by_name}</p>
                          <p className="text-slate-400">{new Date(cs.incident_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {cs.status === 'PENDING' && (
                        <div className="flex gap-2 pt-4 border-t border-slate-50 max-w-xl">
                          <Input
                            placeholder="Resolution remarks..."
                            value={resolveNotes[cs.id] || ''}
                            onChange={(e) => setResolveNotes({ ...resolveNotes, [cs.id]: e.target.value })}
                            className="h-10 rounded-xl"
                          />
                          <Button
                            onClick={() => handleResolve(cs.id)}
                            disabled={resolvingId === cs.id}
                            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-50"
                          >
                            {resolvingId === cs.id ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <CheckCircle size={14} />}
                            CLOSE CASE
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
