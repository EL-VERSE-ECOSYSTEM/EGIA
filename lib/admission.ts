import { db } from '@/lib/db'
import { school, student, teacher } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function generateSequentialAdmissionNumber(schoolId: string | null, className: string): Promise<string> {
  let schoolCode = 'SCHO'
  if (schoolId) {
    const schoolRec = await db.query.school.findFirst({ where: eq(school.id, schoolId) })
    if (schoolRec?.code) {
      const clean = schoolRec.code.replace(/[^a-zA-Z]/g, '').toUpperCase()
      schoolCode = clean.slice(0, 4) || 'SCHO'
    }
  }

  const normalizedClass = (className || '').replace(/\s+/g, '').toUpperCase()
  const isPupil = /^(PRIMARY[3-6]|BASIC[56]|P[3-6]|PRIMARY5\/6|P5\/6)$/.test(normalizedClass)
  const tag = isPupil ? 'P' : 'S'

  if (!schoolId) {
    const random6 = Math.floor(100000 + Math.random() * 900000)
    return `${schoolCode}-${tag}-${random6}`
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const res = await db.execute(sql`
        INSERT INTO public.admission_number_sequences (schoolid, last_number)
        VALUES (${schoolId}, 1)
        ON CONFLICT (schoolid)
        DO UPDATE SET last_number = public.admission_number_sequences.last_number + 1
        RETURNING last_number
      `)
      const nextNum = res && res[0] && res[0].last_number ? Number(res[0].last_number) : 0
      if (nextNum < 1 || nextNum > 999999) throw new Error('The school admission number sequence is exhausted.')
      const candidate = `${schoolCode}-${tag}-${nextNum.toString().padStart(6, '0')}`
      const existing = await db.query.student.findFirst({
        where: eq(student.admissionNumber, candidate),
      })
      if (!existing) return candidate
    } catch (err) {
      console.error('Could not allocate a unique school admission number.', err)
      throw new Error('A unique admission number could not be generated. Please try again.', { cause: err })
    }
  }
  throw new Error('A unique admission number could not be generated. Please try again.')
}

export async function generateSequentialStaffCode(schoolId: string | null): Promise<string> {
  let schoolCode = 'SCHO'
  if (schoolId) {
    const schoolRec = await db.query.school.findFirst({ where: eq(school.id, schoolId) })
    if (schoolRec?.code) {
      const clean = schoolRec.code.replace(/[^a-zA-Z]/g, '').toUpperCase()
      schoolCode = clean.slice(0, 4) || 'SCHO'
    }
  }

  if (!schoolId) {
    const random6 = Math.floor(100000 + Math.random() * 900000)
    return `${schoolCode}-ST-${random6}`
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const res = await db.execute(sql`
        INSERT INTO public.admission_number_sequences (schoolid, last_number)
        VALUES (${schoolId}, 1)
        ON CONFLICT (schoolid)
        DO UPDATE SET last_number = public.admission_number_sequences.last_number + 1
        RETURNING last_number
      `)
      const nextNum = res && res[0] && res[0].last_number ? Number(res[0].last_number) : 0
      if (nextNum < 1 || nextNum > 999999) throw new Error('The school staff ID sequence is exhausted.')
      const candidate = `${schoolCode}-ST-${nextNum.toString().padStart(6, '0')}`
      const existing = await db.query.teacher.findFirst({
        where: eq(teacher.staffCode, candidate),
      })
      if (!existing) return candidate
    } catch (err) {
      console.error('Could not allocate a unique school staff code.', err)
      throw new Error('A unique staff ID could not be generated. Please try again.', { cause: err })
    }
  }
  throw new Error('A unique staff ID could not be generated. Please try again.')
}
