'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { institutionTransferRequest, parent, school, student, teacher, user, jobs } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { sendInstitutionTransferApprovalEmail } from '@/lib/mailer'
import { after } from 'next/server'
import { cleanupInstitutionTransfer } from '@/lib/transfers/cleanup'

export async function lookupTransferSchool(code: string) {
  const session = await auth.getSession()
  if (!session?.user) return { success: false, error: 'Sign in to request a transfer.' }
  const clean = code.trim().toUpperCase()
  if (!/^[A-Z]{1,4}-\d{6}$/.test(clean)) return { success: false, error: 'Enter a valid school registration code.' }
  const [record] = await db.select({ id: school.id, name: school.name, location: school.location })
    .from(school).where(and(eq(school.code, clean), eq(school.paymentStatus, 'PAID'))).limit(1)
  return record ? { success: true, school: record } : { success: false, error: 'No school matches that registration code.' }
}

export async function requestInstitutionTransfer(code: string, wardStudentId?: string) {
  const session = await auth.getSession()
  if (!session?.user) return { success: false, error: 'Sign in to request a transfer.' }
  const target = await lookupTransferSchool(code)
  if (!target.success || !target.school) return { success: false, error: target.error || 'School not found.' }
  const actor = await db.query.user.findFirst({ where: eq(user.id, session.user.id) })
  if (!actor?.schoolId || actor.schoolId === target.school.id) return { success: false, error: 'Your account must belong to a different school before transferring.' }
  const role = (session.user.role || '').toUpperCase()
  let wardId: string | null = null
  if (role === 'STUDENT' || role === 'PUPIL') {
    const profile = await db.query.student.findFirst({ where: eq(student.userId, actor.id) })
    if (!profile || profile.schoolId !== actor.schoolId) return { success: false, error: 'Student profile does not match your current school.' }
  } else if (role === 'TEACHER') {
    const profile = await db.query.teacher.findFirst({ where: eq(teacher.userId, actor.id) })
    if (!profile || profile.schoolId !== actor.schoolId) return { success: false, error: 'Teacher profile does not match your current school.' }
  } else if (role === 'PARENT') {
    const profile = await db.query.parent.findFirst({ where: eq(parent.userId, actor.id) })
    if (!profile || profile.schoolId !== actor.schoolId) return { success: false, error: 'Parent profile does not match your current school.' }
    if (wardStudentId) {
      const ward = await db.query.student.findFirst({ where: and(eq(student.id, wardStudentId), eq(student.parentId, profile.id), eq(student.schoolId, actor.schoolId)) })
      if (!ward) return { success: false, error: 'That ward is not linked to your account at the current school.' }
      wardId = ward.id
    } else {
      const wards = await db.query.student.findMany({ where: and(eq(student.parentId, profile.id), eq(student.schoolId, actor.schoolId)) })
      if (!wards.length) return { success: false, error: 'No linked ward was found at your current school.' }
    }
  } else return { success: false, error: 'Only students, parents, and teachers can request an institution transfer.' }
  const pending = await db.query.institutionTransferRequest.findFirst({ where: and(eq(institutionTransferRequest.userId, actor.id), eq(institutionTransferRequest.status, 'PENDING')) })
  if (pending) return { success: false, error: 'You already have a transfer request awaiting review.' }
  await db.insert(institutionTransferRequest).values({ id: randomUUID(), userId: actor.id, role, oldSchoolId: actor.schoolId, newSchoolId: target.school.id, wardStudentId: wardId })
  revalidatePath('/dashboard/student/leaderboard')
  return { success: true }
}

export async function getTransferRequestsForSchool() {
  const session = await auth.getSession()
  if (!session?.user || !['SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes((session.user.role || '').toUpperCase())) return []
  const actor = await db.query.user.findFirst({ where: eq(user.id, session.user.id) })
  const isSuperAdmin = session.user.role?.toUpperCase() === 'SUPER_ADMIN'
  if (!actor?.schoolId && !isSuperAdmin) return []
  return db.select({ id: institutionTransferRequest.id, userId: institutionTransferRequest.userId, role: institutionTransferRequest.role, status: institutionTransferRequest.status, createdAt: institutionTransferRequest.createdAt, name: user.name, email: user.email, oldSchool: school.name, oldLocation: school.location, wardStudentId: institutionTransferRequest.wardStudentId })
    .from(institutionTransferRequest).innerJoin(user, eq(user.id, institutionTransferRequest.userId))
    .leftJoin(school, eq(school.id, institutionTransferRequest.oldSchoolId))
    .where(isSuperAdmin ? eq(institutionTransferRequest.status, 'PENDING') : and(eq(institutionTransferRequest.newSchoolId, actor!.schoolId!), eq(institutionTransferRequest.status, 'PENDING')))
}

export async function reviewInstitutionTransfer(requestId: string, approve: boolean) {
  const session = await auth.getSession()
  if (!session?.user || !['SCHOOL_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes((session.user.role || '').toUpperCase())) return { success: false, error: 'School administrator access is required.' }
  const actor = await db.query.user.findFirst({ where: eq(user.id, session.user.id) })
  const request = await db.query.institutionTransferRequest.findFirst({ where: and(eq(institutionTransferRequest.id, requestId), eq(institutionTransferRequest.status, 'PENDING')) })
  if (!request || (session.user.role !== 'SUPER_ADMIN' && request.newSchoolId !== actor?.schoolId)) return { success: false, error: 'Pending transfer request was not found for your school.' }
  if (!approve) {
    await db.update(institutionTransferRequest).set({ status: 'REJECTED', reviewedBy: session.user.id }).where(eq(institutionTransferRequest.id, request.id))
    return { success: true }
  }
  const now = new Date()
  const cleanupAfter = new Date(now.getTime() + 30_000)
  await db.transaction(async (tx) => {
    const target = await tx.query.school.findFirst({ where: eq(school.id, request.newSchoolId) })
    if (!target) throw new Error('Destination school no longer exists.')
    await tx.update(user).set({ schoolId: target.id, updatedAt: now }).where(eq(user.id, request.userId))
    if (request.role === 'STUDENT' || request.role === 'PUPIL') {
      await tx.update(student).set({ schoolId: target.id, updatedAt: now, admissionNumber: null }).where(eq(student.userId, request.userId))
    } else if (request.role === 'TEACHER') {
      await tx.update(teacher).set({ schoolId: target.id, updatedAt: now, status: 'PENDING', staffCode: null, assignedClassId: null, handlingClasses: [], teachingSubjects: [], daysPresent: [], presentDays: [] }).where(eq(teacher.userId, request.userId))
    } else if (request.role === 'PARENT') {
      await tx.update(parent).set({ schoolId: target.id, updatedAt: now }).where(eq(parent.userId, request.userId))
      const parentProfile = await tx.query.parent.findFirst({ where: eq(parent.userId, request.userId) })
      if (parentProfile) {
        const wards = await tx.query.student.findMany({ where: request.wardStudentId ? and(eq(student.id, request.wardStudentId), eq(student.parentId, parentProfile.id)) : eq(student.parentId, parentProfile.id) })
        for (const ward of wards) {
          await tx.update(student).set({ schoolId: target.id, updatedAt: now, admissionNumber: null }).where(eq(student.id, ward.id))
          if (ward.userId) await tx.update(user).set({ schoolId: target.id, updatedAt: now }).where(eq(user.id, ward.userId))
        }
      }
    }
    await tx.update(institutionTransferRequest).set({ status: 'APPROVED', reviewedBy: session.user.id, approvedAt: now, cleanupAfter }).where(eq(institutionTransferRequest.id, request.id))
    await tx.insert(jobs).values({ id: randomUUID(), queue: 'maintenance', type: 'institution_transfer_cleanup', payload: { transferId: request.id }, availableAt: cleanupAfter, idempotencyKey: `institution-transfer-cleanup:${request.id}` })
  })
  const recipient = await db.query.user.findFirst({ where: eq(user.id, request.userId) })
  const destination = await db.query.school.findFirst({ where: eq(school.id, request.newSchoolId) })
  if (recipient?.email && destination) {
    try { await sendInstitutionTransferApprovalEmail({ to: recipient.email, name: recipient.name || 'EL Learners user', schoolName: destination.name, location: destination.location }) }
    catch (error) { console.error('Transfer approval email delivery failed.', error) }
  }
  if (request.role === 'PARENT' && destination) {
    const parentProfile = await db.query.parent.findFirst({ where: eq(parent.userId, request.userId) })
    const wards = parentProfile ? await db.query.student.findMany({ where: eq(student.parentId, parentProfile.id) }) : []
    const notifyWards = request.wardStudentId ? wards.filter((ward) => ward.id === request.wardStudentId) : wards.filter((ward) => ward.schoolId === destination.id)
    for (const ward of notifyWards) {
      const wardUser = ward.userId ? await db.query.user.findFirst({ where: eq(user.id, ward.userId) }) : null
      if (wardUser?.email && wardUser.id !== recipient?.id) {
        try { await sendInstitutionTransferApprovalEmail({ to: wardUser.email, name: wardUser.name || `${ward.firstName} ${ward.lastName}`, schoolName: destination.name, location: destination.location }) }
        catch (error) { console.error('Ward transfer approval email delivery failed.', error) }
      }
    }
  }
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, cleanupAfter.getTime() - Date.now())))
    try { await cleanupInstitutionTransfer(request.id) }
    catch (error) { console.error('Scheduled transfer cleanup failed; the durable cleanup job remains available.', error) }
  })
  revalidatePath('/dashboard/admin/transfers')
  return { success: true, cleanupAt: cleanupAfter.toISOString() }
}
