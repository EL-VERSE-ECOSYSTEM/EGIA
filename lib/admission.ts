import { db } from '@/lib/db'
import { admissionNumberSequences, school, teacher, institutionalStaff } from '@/lib/db/schema'
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
  const isPupil = /^(PRIMARY[3-6]|P[3-6]|PRIMARY5\/6|P5\/6)$/.test(normalizedClass)
  const tag = isPupil ? 'P' : 'S'

  if (!schoolId) {
    const random6 = Math.floor(100000 + Math.random() * 900000)
    return `${schoolCode}-${tag}-${random6}`
  }

  try {
    const res = await db.execute(sql`
      INSERT INTO public.admission_number_sequences (schoolid, last_number)
      VALUES (${schoolId}, 1)
      ON CONFLICT (schoolid)
      DO UPDATE SET last_number = public.admission_number_sequences.last_number + 1
      RETURNING last_number
    `)
    const nextNum = res && res[0] && res[0].last_number ? Number(res[0].last_number) : Math.floor(100000 + Math.random() * 900000)
    const suffix = nextNum.toString().padStart(6, '0')
    return `${schoolCode}-${tag}-${suffix}`
  } catch (err) {
    console.warn('Fallback sequence generator for admission number:', err)
    const random6 = Math.floor(100000 + Math.random() * 900000)
    return `${schoolCode}-${tag}-${random6}`
  }
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

  try {
    const existingTeachers = await db.select().from(teacher).where(eq(teacher.schoolId, schoolId))
    const existingStaff = await db.select().from(institutionalStaff).where(eq(institutionalStaff.schoolId, schoolId))
    const total = existingTeachers.length + existingStaff.length + 1
    const suffix = total.toString().padStart(6, '0')
    return `${schoolCode}-ST-${suffix}`
  } catch (err) {
    const random6 = Math.floor(100000 + Math.random() * 900000)
    return `${schoolCode}-ST-${random6}`
  }
}
