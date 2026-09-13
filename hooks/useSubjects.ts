'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface SubjectItem {
  id: string
  name: string
  code: string | null
  educationLevels: string[] | null
  departments: string[] | null
  isCustom?: boolean
}

export function useSubjectsByLevel(level: 'PRIMARY' | 'JUNIOR' | 'SENIOR' | null, schoolId?: string | null) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!level) {
      setSubjects([])
      return
    }

    const supabase = createClient()
    setLoading(true)

    async function fetchSubjects() {
      try {
        let query = supabase
          .from('subject')
          .select('id, name, code, education_levels, departments, is_custom')
          .eq('is_active', true)
          .contains('education_levels', [level])

        if (schoolId) {
          query = query.or(`schoolid.eq.${schoolId},schoolid.is.null`)
        } else {
          query = query.is('schoolid', null)
        }

        const { data, error } = await query.order('name', { ascending: true })

        if (!error && data) {
          setSubjects(
            data.map((item: any) => ({
              id: item.id,
              name: item.name,
              code: item.code,
              educationLevels: item.education_levels,
              departments: item.departments,
              isCustom: item.is_custom
            }))
          )
        }
      } catch (err) {
        console.warn('Failed to fetch subjects by level:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()

    // Realtime subscription
    const channel = supabase
      .channel(`subjects-level-${level}-${schoolId || 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subject' }, () => {
        fetchSubjects()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [level, schoolId])

  return { subjects, loading }
}

export function useDepartmentSubjects(dept: 'SCIENCE' | 'ARTS' | 'COMMERCIAL' | null, schoolId?: string | null) {
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!dept) {
      setSubjects([])
      return
    }

    const supabase = createClient()
    setLoading(true)

    async function fetchDeptSubjects() {
      try {
        let query = supabase
          .from('subject')
          .select('id, name, code, education_levels, departments, is_custom')
          .eq('is_active', true)
          .contains('education_levels', ['SENIOR'])
          .contains('departments', [dept])

        if (schoolId) {
          query = query.or(`schoolid.eq.${schoolId},schoolid.is.null`)
        } else {
          query = query.is('schoolid', null)
        }

        const { data, error } = await query.order('name', { ascending: true })

        if (!error && data) {
          setSubjects(
            data.map((item: any) => ({
              id: item.id,
              name: item.name,
              code: item.code,
              educationLevels: item.education_levels,
              departments: item.departments,
              isCustom: item.is_custom
            }))
          )
        }
      } catch (err) {
        console.warn('Failed to fetch department subjects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDeptSubjects()

    const channel = supabase
      .channel(`subjects-dept-${dept}-${schoolId || 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subject' }, () => {
        fetchDeptSubjects()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dept, schoolId])

  return { subjects, loading }
}

export function useEnrollmentSubjects(admissionClass: string | null, department: string | null, schoolId?: string | null) {
  const normalizedClass = (admissionClass || '').trim().toUpperCase()
  const level: 'PRIMARY' | 'JUNIOR' | 'SENIOR' | null =
    /^(PRIMARY[3-6]|PRIMARY\s*[3-6])$/.test(normalizedClass) || normalizedClass.startsWith('PRIMARY') ? 'PRIMARY'
    : /^(JSS[1-3]|JSS\s*[1-3])$/.test(normalizedClass) || normalizedClass.startsWith('JSS') ? 'JUNIOR'
    : /^(SSS[1-3]|SSS\s*[1-3])$/.test(normalizedClass) || normalizedClass.startsWith('SSS') ? 'SENIOR'
    : null

  const isSenior = level === 'SENIOR'
  const normalizedDept: 'SCIENCE' | 'ARTS' | 'COMMERCIAL' | null =
    department?.toUpperCase() === 'SCIENCE' ? 'SCIENCE' :
    department?.toUpperCase() === 'ARTS' ? 'ARTS' :
    department?.toUpperCase() === 'COMMERCIAL' ? 'COMMERCIAL' : null

  const levelRes = useSubjectsByLevel(isSenior ? null : level, schoolId)
  const deptRes = useDepartmentSubjects(isSenior ? normalizedDept : null, schoolId)

  return isSenior ? deptRes : levelRes
}
