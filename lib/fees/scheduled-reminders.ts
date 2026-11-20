import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { feeStructure, parent, payment, student } from '@/lib/db/schema'
import { getCbtFeeClearance } from '@/lib/fees/cbt-clearance'
import { claimFeeReminder, releaseFeeReminderClaim } from '@/lib/fees/fee-reminder-claims'
import { notifyUser } from '@/lib/notifications/triggers'
import type { PushNotification } from '@/lib/firebase/types'

export async function sendScheduledFeeReminders() {
  const students = await db.query.student.findMany({
    where: and(eq(student.isActive, true), isNotNull(student.schoolId)),
  })
  const studentChunks: (typeof students)[] = []
  for (let index = 0; index < students.length; index += 100) {
    studentChunks.push(students.slice(index, index + 100))
  }

  let scanned = 0
  let reminded = 0
  let failed = 0

  for (const chunk of studentChunks) {
    const schoolIds = [...new Set(chunk.map((profile) => profile.schoolId).filter((id): id is string => Boolean(id)))]
    const classNames = [...new Set(chunk.map((profile) => profile.class))]
    const studentIds = chunk.map((profile) => profile.id)
    const parentIds = [...new Set(chunk.flatMap((profile) => profile.parentId ? [profile.parentId] : []))]
    const [fees, payments] = await Promise.all([
      db.query.feeStructure.findMany({
        where: and(
          eq(feeStructure.isActive, true),
          inArray(feeStructure.schoolId, schoolIds),
          inArray(feeStructure.class, classNames),
        ),
      }),
      db.query.payment.findMany({
        where: inArray(payment.studentId, studentIds),
      }),
    ])
    const parents = parentIds.length
      ? await db.query.parent.findMany({ where: inArray(parent.id, parentIds) })
      : []
    const feesByClass = new Map<string, typeof fees>()
    for (const fee of fees) {
      const key = `${fee.schoolId}:${fee.class}`
      feesByClass.set(key, [...(feesByClass.get(key) || []), fee])
    }
    const paymentsByStudent = new Map<string, typeof payments>()
    for (const row of payments) {
      paymentsByStudent.set(row.studentId, [...(paymentsByStudent.get(row.studentId) || []), row])
    }
    const parentById = new Map<string, (typeof parents)[number]>(
      parents.map((record) => [record.id, record]),
    )

    for (const profile of chunk) {
      scanned += 1
      const clearance = getCbtFeeClearance(
        feesByClass.get(`${profile.schoolId}:${profile.class}`) || [],
        paymentsByStudent.get(profile.id) || [],
        profile.department,
      )
      if (clearance.eligible) continue

      const recipientSet = new Set<string>()
      if (profile.userId) recipientSet.add(profile.userId)
      const linkedParent = profile.parentId ? parentById.get(profile.parentId) : null
      if (linkedParent?.userId && linkedParent.schoolId === profile.schoolId) {
        recipientSet.add(linkedParent.userId)
      }
      const recipients = [...recipientSet]
      if (!recipients.length) continue

      const notice: PushNotification = {
        title: 'School fee payment needed for CBT access',
        body: `At least ${clearance.requiredPercentage}% of school fees must be paid before CBT access. Recorded payment: ${clearance.paidPercentage.toFixed(1)}%.`,
        type: 'payment_reminder',
        link: '/dashboard/student/assessments/cbt',
        data: { studentId: profile.id, paidPercentage: clearance.paidPercentage.toFixed(1) },
      }
      for (const userId of recipients) {
        let claimed = false
        try {
          claimed = await claimFeeReminder(userId, profile.id)
          if (!claimed) continue
          await notifyUser(userId, notice)
          reminded += 1
        } catch (error) {
          if (claimed) {
            try {
              await releaseFeeReminderClaim(userId, profile.id)
            } catch (releaseError) {
              console.error('Unable to release failed school-fee reminder claim:', {
                studentId: profile.id,
                userId,
                error: releaseError instanceof Error ? releaseError.message : String(releaseError),
              })
            }
          }
          failed += 1
          console.error('Scheduled school-fee reminder failed:', {
            studentId: profile.id,
            userId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }
  }

  return { scanned, reminded, failed }
}
