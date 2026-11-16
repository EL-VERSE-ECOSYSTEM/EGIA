import 'server-only'
import { and, eq, isNull } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { schoolRegistrationApplication, user as userTable } from '@/lib/db/schema'
import { generateOtp, storeOtp } from '@/lib/otp'
import { sendOtpEmail } from '@/lib/mailer'
import { sendFCMOtp } from '@/lib/services/notifications'

export async function sendSchoolRegistrationOtpOnce(paymentReference: string) {
  const now = new Date()
  const [application] = await db.update(schoolRegistrationApplication)
    .set({ paymentOtpSentAt: now, updatedAt: now })
    .where(and(
      eq(schoolRegistrationApplication.paymentReference, paymentReference),
      eq(schoolRegistrationApplication.paymentStatus, 'SUCCESS'),
      isNull(schoolRegistrationApplication.paymentOtpSentAt),
    ))
    .returning({
      schoolId: schoolRegistrationApplication.schoolId,
      email: schoolRegistrationApplication.applicantEmail,
      applicantName: schoolRegistrationApplication.applicantName,
    })

  if (!application) return { sent: false, alreadySent: true }

  const email = application.email.trim().toLowerCase()
  const otp = generateOtp()
  let emailSent = false
  let pushSent = false
  try {
    await storeOtp(email, otp)
    try {
      await sendOtpEmail(email, otp)
      emailSent = true
    } catch (error) {
      console.warn('School registration OTP email delivery failed.', error)
    }

    const [existingUser] = await db.select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1)
    if (existingUser) {
      const pushResult = await sendFCMOtp({
        userId: existingUser.id,
        otpCode: otp,
        type: 'SCHOOL_REGISTRATION',
        title: `School registration verification for ${application.applicantName}`,
      })
      pushSent = pushResult.sent
    }

    if (emailSent || pushSent) return { sent: true, channel: emailSent && pushSent ? 'email and push' : emailSent ? 'email' : 'push' }

    throw new Error('No school registration OTP delivery channel is available.')
  } catch (error) {
    await db.update(schoolRegistrationApplication)
      .set({ paymentOtpSentAt: null, updatedAt: new Date() })
      .where(and(
        eq(schoolRegistrationApplication.paymentReference, paymentReference),
        eq(schoolRegistrationApplication.paymentOtpSentAt, now),
      ))
    console.error('School registration OTP could not be delivered.', { requestId: randomUUID(), error })
    return { sent: false, alreadySent: false }
  }
}
