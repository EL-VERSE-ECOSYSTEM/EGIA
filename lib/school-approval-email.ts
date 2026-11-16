import 'server-only'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { school, schoolRegistrationApplication } from '@/lib/db/schema'
import { sendSchoolAccountEmail } from '@/lib/mailer'

export async function sendSchoolApprovalEmailOnce(applicationId: string, temporaryPassword?: string) {
  const sentAt = new Date()
  const [application] = await db.update(schoolRegistrationApplication)
    .set({ approvalEmailSentAt: sentAt, updatedAt: sentAt })
    .where(and(
      eq(schoolRegistrationApplication.id, applicationId),
      eq(schoolRegistrationApplication.paymentStatus, 'SUCCESS'),
      eq(schoolRegistrationApplication.approvalStatus, 'APPROVED'),
      isNull(schoolRegistrationApplication.approvalEmailSentAt),
    ))
    .returning({
      schoolId: schoolRegistrationApplication.schoolId,
      email: schoolRegistrationApplication.applicantEmail,
      name: schoolRegistrationApplication.applicantName,
    })

  if (!application) return { sent: false, alreadySent: true }
  try {
    const schoolRecord = await db.query.school.findFirst({
      where: eq(school.id, application.schoolId),
      columns: { name: true, code: true, logoUrl: true },
    })
    if (!schoolRecord) throw new Error('Approved school record was not found.')
    await sendSchoolAccountEmail({
      to: application.email,
      name: application.name,
      role: 'SCHOOL ADMINISTRATOR',
      schoolName: schoolRecord.name,
      schoolLogoUrl: schoolRecord.logoUrl,
      accountIdentifier: schoolRecord.code,
      temporaryPassword,
      approved: true,
    })
    return { sent: true, alreadySent: false }
  } catch (error) {
    await db.update(schoolRegistrationApplication)
      .set({ approvalEmailSentAt: null, updatedAt: new Date() })
      .where(and(
        eq(schoolRegistrationApplication.id, applicationId),
        eq(schoolRegistrationApplication.approvalEmailSentAt, sentAt),
      ))
    console.error('School approval email could not be delivered.', { applicationId, error })
    return { sent: false, alreadySent: false }
  }
}
