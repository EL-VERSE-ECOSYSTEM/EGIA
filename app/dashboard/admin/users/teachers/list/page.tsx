'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, MoreVertical, Edit2, Trash2, Mail, X, Check, Loader2 } from 'lucide-react'
import { getAllTeachers, promoteTeacherAction } from '@/app/actions/admin'
import { adminUpdateTeacherClassAndSubjects } from '@/app/actions/teacher'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit modal states
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Promotion state
  const [promotionLevel, setPromotionLevel] = useState<string>('NONE')
  const [contractType, setContractType] = useState<string>('FULL_TIME')
  const [isClassTeacher, setIsClassTeacher] = useState<boolean>(false)

  const availableClasses = ['Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']
  const availableSubjects = [
    'Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics',
    'Civic Education', 'Data Processing', 'Commerce', 'Financial Accounting',
    'Economics', 'Government', 'Literature in English'
  ]

  const loadData = async () => {
    try {
      const data = await getAllTeachers()
      setTeachers(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenEdit = (t: any) => {
    setEditingTeacher(t)
    setSelectedClasses(Array.isArray(t.handlingClasses) ? t.handlingClasses : [])
    setSelectedSubjects(Array.isArray(t.teachingSubjects) ? t.teachingSubjects : [])
    setContractType(t.type || 'FULL_TIME')
    setIsClassTeacher(Boolean(t.isClassTeacher))
    setPromotionLevel('NONE')
  }

  const handleToggleClass = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter(c => c !== cls))
    } else {
      setSelectedClasses([...selectedClasses, cls])
    }
  }

  const handleToggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj))
    } else {
      setSelectedSubjects([...selectedSubjects, subj])
    }
  }

  const handleSaveAssignments = async () => {
    if (!editingTeacher) return
    setSaving(true)
    try {
      await adminUpdateTeacherClassAndSubjects(editingTeacher.id, selectedClasses, selectedSubjects)
      if (promotionLevel !== 'NONE' || contractType !== editingTeacher.type || isClassTeacher !== Boolean(editingTeacher.isClassTeacher)) {
        await promoteTeacherAction({
          teacherId: editingTeacher.id,
          newType: contractType as any,
          isClassTeacher: isClassTeacher,
          adminLevel: promotionLevel as any
        })
      }
      toast.success('Teacher allocations & promotions updated in real-time!')
      setEditingTeacher(null)
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update allocations')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Academic Staff</h1>
            <p className="text-slate-500 font-medium text-lg">Allocate, promote, and demote teachers from handling specific classes and subjects in real-time.</p>
          </div>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-amber-950 h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-amber-200">
             <Link href="/dashboard/admin/users/teachers/add"><Plus className="w-6 h-6 mr-2" /> Register Staff</Link>
          </Button>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input className="pl-12 h-12 rounded-2xl bg-slate-50 border-none font-medium text-xs" placeholder="Search staff by name..." />
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Staff Details</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">ID / Email</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Assigned Classes</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Teaching Subjects</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                         [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="p-10 bg-slate-50/50 border-b" /></tr>)
                      ) : teachers.length === 0 ? (
                         <tr><td colSpan={5} className="p-24 text-center text-slate-400 font-bold italic">No teachers found in directory.</td></tr>
                      ) : teachers.map((t) => (
                         <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-sm">
                                     {t.firstName[0]}{t.lastName[0]}
                                  </div>
                                  <div>
                                     <p className="font-black text-slate-900">{t.firstName} {t.lastName}</p>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase">{t.qualification || 'Educator'}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-6">
                               <p className="font-bold text-slate-700 text-xs font-mono">{t.staffCode || 'N/A'}</p>
                               <p className="text-[10px] text-slate-400">{t.user?.email || 'No email bound'}</p>
                            </td>
                            <td className="p-6">
                               <div className="flex flex-wrap gap-1 max-w-[200px]">
                                 {t.handlingClasses && Array.isArray(t.handlingClasses) && t.handlingClasses.length > 0 ? (
                                   t.handlingClasses.map((c: string) => <Badge key={c} className="bg-purple-50 text-purple-700 text-[9px] font-black border-none px-2 py-0.5">{c}</Badge>)
                                 ) : (
                                   <span className="text-slate-400 italic text-[11px] font-bold">Unassigned</span>
                                 )}
                               </div>
                            </td>
                            <td className="p-6">
                               <div className="flex flex-wrap gap-1 max-w-[240px]">
                                 {t.teachingSubjects && Array.isArray(t.teachingSubjects) && t.teachingSubjects.length > 0 ? (
                                   t.teachingSubjects.map((s: string) => <Badge key={s} className="bg-emerald-50 text-emerald-700 text-[9px] font-black border-none px-2 py-0.5">{s}</Badge>)
                                 ) : (
                                   <span className="text-slate-400 italic text-[11px] font-bold">Unassigned</span>
                                 )}
                               </div>
                            </td>
                            <td className="p-6 text-right">
                               <div className="flex justify-end gap-2">
                                  <Button onClick={() => handleOpenEdit(t)} size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                                     <Edit2 className="w-4 h-4" />
                                  </Button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </CardContent>
        </Card>

        {/* Allocate/Promote/Demote Dialog Modal */}
        {editingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-2xl border-none shadow-2xl rounded-3xl bg-white overflow-hidden animate-in zoom-in duration-200">
              <CardHeader className="bg-slate-900 text-white p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black">Staff Allocations: {editingTeacher.firstName} {editingTeacher.lastName}</CardTitle>
                  <p className="text-xs font-bold text-slate-400 mt-1">Promote or demote teacher classes and subject alignments in real-time</p>
                </div>
                <button onClick={() => setEditingTeacher(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Classes block */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Assigned Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableClasses.map(cls => {
                      const active = selectedClasses.includes(cls)
                      return (
                        <button
                          key={cls}
                          onClick={() => handleToggleClass(cls)}
                          className={`px-4 py-2 rounded-xl font-black text-xs border transition-all flex items-center gap-1.5 ${
                            active
                              ? 'bg-purple-100 border-purple-200 text-purple-700 shadow-sm'
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {active && <Check size={12} />}
                          {cls}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Staff Promotion / Elevation Block */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase text-amber-600 tracking-wider">Staff Elevation & Administrative Promotion</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Contract Type</label>
                      <select
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-bold text-xs"
                      >
                        <option value="FULL_TIME">Full-Time Staff</option>
                        <option value="PART_TIME">Part-Time Instructor</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Promote to Admin Level</label>
                      <select
                        value={promotionLevel}
                        onChange={(e) => setPromotionLevel(e.target.value)}
                        className="w-full h-11 rounded-xl border border-amber-200 bg-amber-50/50 px-3 font-bold text-xs text-amber-900"
                      >
                        <option value="NONE">No Administrative Elevation</option>
                        <option value="PRIMARY_ADMIN">Primary School Administrator</option>
                        <option value="VICE_PRINCIPAL_ACADEMICS">Vice Principal (Academics)</option>
                        <option value="VICE_PRINCIPAL_ADMIN">Vice Principal (Administration)</option>
                        <option value="HOD_SCIENCE">HOD - Science Department</option>
                        <option value="HOD_ARTS">HOD - Arts Department</option>
                        <option value="HOD_COMMERCIAL">HOD - Commercial Department</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subjects block */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Teaching Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjects.map(subj => {
                      const active = selectedSubjects.includes(subj)
                      return (
                        <button
                          key={subj}
                          onClick={() => handleToggleSubject(subj)}
                          className={`px-4 py-2 rounded-xl font-black text-xs border transition-all flex items-center gap-1.5 ${
                            active
                              ? 'bg-emerald-100 border-emerald-200 text-emerald-700 shadow-sm'
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {active && <Check size={12} />}
                          {subj}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setEditingTeacher(null)} className="rounded-xl h-12 font-bold px-6">Cancel</Button>
                  <Button
                    onClick={handleSaveAssignments}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-xl h-12 px-6 shadow-lg shadow-amber-200 flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Save Realtime Allocations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
