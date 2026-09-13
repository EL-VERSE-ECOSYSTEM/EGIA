'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, GraduationCap, RefreshCw, Eye, ExternalLink, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export interface StudentListPageProps {
  scope: 'CLASS_TEACHER' | 'SUBJECT_TEACHER' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN'
  schoolId?: string | null
  teacherId?: string | null
  classId?: string | null
}

export function StudentListPage({ scope, schoolId, teacherId, classId }: StudentListPageProps) {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('student')
        .select(`
          id,
          firstname,
          middlename,
          lastname,
          admissionnumber,
          class,
          department,
          gender,
          dateofbirth,
          registrationstatus,
          registration_paid,
          profileimage,
          schoolid,
          createdat,
          parent:parent(id, firstname, lastname, phonenumber),
          school:school(id, name, code)
        `)

      if (scope === 'SCHOOL_ADMIN' && schoolId) {
        query = query.eq('schoolid', schoolId)
      } else if (scope === 'CLASS_TEACHER' && classId) {
        query = query.eq('class', classId)
      }

      const { data, error } = await query.order('lastname', { ascending: true })

      if (!error && data) {
        setStudents(data)
      }
    } catch (err) {
      console.warn('Failed to fetch students list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()

    const supabase = createClient()
    const channel = supabase
      .channel(`student-list-${scope}-${schoolId || 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student' }, () => {
        fetchStudents()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [scope, schoolId, classId])

  const filtered = students.filter(s =>
    `${s.firstname || ''} ${s.lastname || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.admissionnumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.class || '').toLowerCase().includes(search.toLowerCase())
  )

  const isSuperAdmin = scope === 'SUPER_ADMIN'
  const isSchoolAdmin = scope === 'SCHOOL_ADMIN' || isSuperAdmin

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-orange-500" /> Student & Pupil Roster ({scope.replace('_', ' ')})
          </CardTitle>
          <CardDescription className="text-slate-400 font-bold text-xs mt-1">
            Role-scoped roster with real-time Supabase Database synchronization and tenant protection.
          </CardDescription>
        </div>
        <button
          type="button"
          onClick={fetchStudents}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Roster
        </button>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, admission number, or class..."
            value={search ?? ''}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs font-medium text-slate-700">
            <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Learner Name</th>
                <th className="px-4 py-3">Admission No</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Gender</th>
                {isSchoolAdmin && <th className="px-4 py-3">Parent Contact</th>}
                {isSuperAdmin && <th className="px-4 py-3">School</th>}
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : isSchoolAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-400 font-bold italic">
                    {loading ? 'Loading roster from Supabase...' : 'No student or pupil records found.'}
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      {s.profileimage ? (
                        <img src={s.profileimage} alt="" className="w-8 h-8 rounded-full object-cover border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-black text-xs flex items-center justify-center">
                          {s.firstname?.[0]}{s.lastname?.[0]}
                        </div>
                      )}
                      <span>{s.firstname} {s.middlename ? `${s.middlename} ` : ''}{s.lastname}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-orange-600">{s.admissionnumber || 'Pending Payment'}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{s.class} {s.department ? `(${s.department})` : ''}</td>
                    <td className="px-4 py-3">{s.gender || 'Male'}</td>
                    {isSchoolAdmin && (
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {s.parent ? `${s.parent.firstname} ${s.parent.lastname} (${s.parent.phonenumber || 'N/A'})` : 'Not Linked'}
                      </td>
                    )}
                    {isSuperAdmin && (
                      <td className="px-4 py-3 font-bold text-slate-600">{s.school?.name || 'Academy'}</td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        s.registration_paid || s.registrationstatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.registration_paid || s.registrationstatus === 'ACTIVE' ? 'ACTIVE' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
