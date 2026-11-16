import { db } from '@/lib/db'
import { institutionTransferRequest, jobs, parent, student, teacher } from '@/lib/db/schema'
import { and, eq, lte, isNull, sql } from 'drizzle-orm'

export async function cleanupInstitutionTransfer(transferId: string) {
  const item = await db.query.institutionTransferRequest.findFirst({ where: and(eq(institutionTransferRequest.id, transferId), eq(institutionTransferRequest.status, 'APPROVED'), isNull(institutionTransferRequest.cleanedAt), lte(institutionTransferRequest.cleanupAfter, new Date())) })
  if (!item) return false
  await db.transaction(async (tx) => {
    const learnerIds: string[] = []
    if (item.role === 'STUDENT' || item.role === 'PUPIL') {
      const profile = await tx.query.student.findFirst({ where: eq(student.userId, item.userId) })
      if (profile) learnerIds.push(profile.id)
    } else if (item.role === 'PARENT') {
      const profile = await tx.query.parent.findFirst({ where: eq(parent.userId, item.userId) })
      if (profile) {
        const wards = await tx.query.student.findMany({ where: eq(student.parentId, profile.id) })
        learnerIds.push(...wards.filter((ward) => ward.schoolId === item.newSchoolId).map((ward) => ward.id))
      }
    }
    for (const learnerId of learnerIds) {
      // Historical report_card rows intentionally remain untouched.
      await tx.execute(sql`DELETE FROM public.assessment_result ar USING public.assessment a WHERE ar."assessmentId" = a.id AND ar."studentId" = ${learnerId} AND a.schoolid = ${item.oldSchoolId}`)
      await tx.execute(sql`DELETE FROM public.attendance att USING public.class c WHERE att."classId" = c.id AND att."studentId" = ${learnerId} AND c."schoolId" = ${item.oldSchoolId}`)
      await tx.execute(sql`DELETE FROM public.cbt_attempts ca USING public.cbt_sessions cs, public.assessment a WHERE ca.session_id = cs.id AND cs.assessment_id = a.id AND ca.student_id = ${learnerId} AND a.schoolid = ${item.oldSchoolId}`)
      const learner = await tx.query.student.findFirst({ where: eq(student.id, learnerId) })
      if (learner?.userId) await tx.execute(sql`DELETE FROM public.tournament_scores WHERE student_id = ${learner.userId} AND school_id = ${item.oldSchoolId}`)
      await tx.execute(sql`DELETE FROM public.student_gifts WHERE student_id = ${learnerId} AND schoolid = ${item.oldSchoolId}`)
      await tx.execute(sql`DELETE FROM public.student_badges WHERE student_id = ${learnerId}`)
    }
    if (item.role === 'TEACHER') {
      const profile = await tx.query.teacher.findFirst({ where: eq(teacher.userId, item.userId) })
      if (profile) {
        await tx.execute(sql`DELETE FROM public.teacher_attendance WHERE teacherid = ${profile.id} AND schoolid = ${item.oldSchoolId}`)
        await tx.execute(sql`DELETE FROM public.teacher_on_subject tos USING public.class c WHERE tos."teacherId" = ${profile.id} AND tos."classId" = c.id AND c."schoolId" = ${item.oldSchoolId}`)
        await tx.execute(sql`UPDATE public.class SET "teacherId" = NULL WHERE "teacherId" = ${profile.id} AND "schoolId" = ${item.oldSchoolId}`)
      }
    }
    const changed = await tx.update(institutionTransferRequest).set({ cleanedAt: new Date() }).where(and(eq(institutionTransferRequest.id, item.id), isNull(institutionTransferRequest.cleanedAt))).returning({ id: institutionTransferRequest.id })
    if (changed.length) await tx.update(jobs).set({ status: 'COMPLETED', completedAt: new Date() }).where(eq(jobs.idempotencyKey, `institution-transfer-cleanup:${item.id}`))
  })
  return true
}
