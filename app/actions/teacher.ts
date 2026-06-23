'use server'
import { db } from '@/lib/db'
import { assessment } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'

export async function createAssessment(data: any) {
  const result = await db.insert(assessment).values({
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  revalidatePath('/dashboard/teacher/assessments')
  return result[0]
}
