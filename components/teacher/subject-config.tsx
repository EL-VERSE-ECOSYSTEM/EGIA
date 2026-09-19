'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { School, BookOpen, Users, Check, AlertCircle, Loader2 } from 'lucide-react'
import { updateTeacherSubjects, getStudentsBySubject } from '@/app/actions/teacher'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface SubjectConfigProps {
  initialSubjects: string[]
}

export function SubjectConfig({ initialSubjects = [] }: SubjectConfigProps) {
  const [dbSubjects, setDbSubjects] = useState<string[]>([])

  useEffect(() => {
    async function loadSubjects() {
      const supabase = createClient()
      const { data } = await supabase.from('subject').select('name').eq('is_active', true).order('name')
      if (data && data.length > 0) {
        setDbSubjects(data.map(s => String(s.name || '')))
      }
    }
    loadSubjects()
  }, [])
  const router = useRouter()
  const [isSubjectTeacher, setIsSubjectTeacher] = useState(initialSubjects.length > 0)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubjects)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSaved] = useState(false)

  // Students viewing state
  const [activeSubjectTab, setActiveSubjectTab] = useState<string | null>(initialSubjects[0] || null)
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject))
    } else {
      setSelectedSubjects([...selectedSubjects, subject])
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSavedSaved(false)
    try {
      const subjectsToSave = isSubjectTeacher ? selectedSubjects : []
      await updateTeacherSubjects(subjectsToSave)
      setSavedSaved(true)
      setActiveSubjectTab(subjectsToSave[0] || null)
      toast.success('Subject configuration updated successfully!')
      setTimeout(() => setSavedSaved(false), 3000)
      router.refresh()
    } catch (err) {
      console.error('Failed to update teacher subjects:', err)
      toast.error('Failed to update subject configuration. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Load students when active subject tab changes
  useEffect(() => {
    if (activeSubjectTab) {
      setLoadingStudents(true)
      setStudentsError(null)
      getStudentsBySubject(activeSubjectTab)
        .then(res => {
          // Sort students by class first, then alphabetically
          const sorted = [...res].sort((a, b) => {
            if (a.class !== b.class) return a.class.localeCompare(b.class)
            return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
          })
          setStudents(sorted)
          setLoadingStudents(false)
        })
        .catch(err => {
          console.error('Error fetching students by subject:', err)
          setStudentsError('Unable to load student roster for this subject.')
          setLoadingStudents(false)
          toast.error('Unable to load student roster. Please try again.')
        })
    } else {
      setStudents([])
    }
  }, [activeSubjectTab])

  return (
    <div className="space-y-10">
      {/* Configuration Panel */}
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
        <div className="h-3 bg-purple-600 w-full" />
        <CardHeader className="p-10 pb-4">
          <CardTitle className="text-2xl font-black text-slate-900">Subject Teaching Confirmation</CardTitle>
          <CardDescription className="text-slate-400 font-bold">
            Confirm if you are a Subject Teacher and specify the subjects you take.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10 space-y-8">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isSubjectTeacher"
              checked={isSubjectTeacher}
              onChange={(e) => setIsSubjectTeacher(e.target.checked)}
              className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
            />
            <Label htmlFor="isSubjectTeacher" className="text-sm font-black text-slate-900 cursor-pointer">
              Yes, I am also a Subject Teacher taking specific academic subjects too.
            </Label>
          </div>

          {isSubjectTeacher && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Subjects You Are Taking</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {dbSubjects.map((sub) => {
                  const isChecked = selectedSubjects.includes(sub)
                  return (
                    <div
                      key={sub}
                      onClick={() => handleSubjectToggle(sub)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isChecked ? 'border-purple-600 bg-purple-50' : 'border-slate-100 hover:border-purple-100 bg-white'}`}
                    >
                      <Checkbox checked={isChecked} onCheckedChange={() => {}} />
                      <span className="text-xs font-black text-slate-800">{sub}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black h-12 px-8 rounded-xl shadow-lg shadow-purple-100"
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : 'CONFIRM & SAVE'}
            </Button>
            {savedSuccess && (
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5 animate-in slide-in-from-left-2">
                <Check size={16} /> Preferences updated successfully!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Viewer Panel */}
      {isSubjectTeacher && selectedSubjects.length > 0 && (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">View Pupils by Subject</CardTitle>
              <CardDescription className="text-slate-400 font-bold">
                Select your subject to view students taking it across classes.
              </CardDescription>
            </div>
            <Users className="text-slate-200 w-8 h-8" />
          </CardHeader>
          <CardContent className="p-0">
            {/* Subject Tabs */}
            <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50 px-10 gap-2 scrollbar-none py-3">
              {selectedSubjects.map((sub) => {
                const isActive = activeSubjectTab === sub
                return (
                  <button
                    key={sub}
                    onClick={() => setActiveSubjectTab(sub)}
                    className={`h-10 px-5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/10' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {sub}
                  </button>
                )
              })}
            </div>

            {/* Students Table */}
            <div className="p-10">
              {loadingStudents ? (
                <div className="text-center py-20 text-slate-400 font-bold italic">Loading class list...</div>
              ) : studentsError ? (
                <div className="text-center py-20 text-red-500 font-bold italic space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
                  <p>{studentsError}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold italic space-y-4">
                  <AlertCircle className="w-12 h-12 text-slate-200 mx-auto" />
                  <p>No students are currently mapped to {activeSubjectTab}.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="p-5">Student Name</th>
                        <th className="p-5">Class</th>
                        <th className="p-5">Admission Number</th>
                        <th className="p-5">Subject Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold text-slate-800 text-sm">
                      {students.map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-5 font-black text-slate-900">{student.firstName} {student.lastName}</td>
                          <td className="p-5">
                            <Badge className="bg-slate-100 text-slate-700 font-black">{student.class}</Badge>
                          </td>
                          <td className="p-5 text-slate-500 font-mono">{student.admissionNumber}</td>
                          <td className="p-5 text-emerald-600 flex items-center gap-1.5">
                            <Check size={14} /> Registered
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
