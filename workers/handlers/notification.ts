import { JobHandler } from '../registry'

export const notificationHandler: JobHandler = async (payload) => {
  const { title, body, userId, schoolId, fcmToken, type } = payload
  if (!title || !body) {
    throw new Error('Malformed notification payload: missing title or body')
  }

  // If FCM token is available, attempt FCM server-side dispatch
  if (fcmToken) {
    try {
      const { sendFCMNotification } = await import('@/lib/firebase/server')
      return await sendFCMNotification(fcmToken, {
        title,
        body,
        type: (type as any) || 'announcement',
        data: { userId: String(userId || ''), schoolId: String(schoolId || '') },
      })
    } catch (err: any) {
      console.warn(`[Worker:Notification] FCM dispatch deferred:`, err.message)
    }
  }

  return {
    status: 'RECORDED',
    title,
    body,
    userId,
    schoolId,
    deliveredAt: new Date().toISOString(),
  }
}
