import { JobHandler } from '../registry'

export const emailHandler: JobHandler = async (payload) => {
  const { to, subject, html, text, otp } = payload
  if (!to) {
    throw new Error('Malformed email payload: missing to recipient')
  }

  try {
    const { getTransporter, sendOtpEmail } = await import('@/lib/mailer')
    if (otp) {
      return await sendOtpEmail(to, otp)
    }

    const transporter = getTransporter()
    const user = process.env.GMAIL_USER
    return await transporter.sendMail({
      from: `"EL Learners" <${user}>`,
      to,
      subject: subject || 'EL Learners Notification',
      text: text || 'You have a new update from EL Learners.',
      html: html || undefined,
    })
  } catch (err: any) {
    console.warn(`[Worker:Email] Email dispatch deferred/failed for ${to}:`, err.message)
    throw err
  }
}
