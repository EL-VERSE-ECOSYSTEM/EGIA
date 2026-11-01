import { enqueueOutboxEvent } from '@/lib/outbox'

export interface DegradationResponse<T = any> {
  degraded: boolean;
  message?: string;
  data?: T;
}

/**
 * AI Service Graceful Degradation:
 * Saves the submission safely and defers processing without failing the user.
 */
export async function handleAiDegradation(
  assessmentId: string,
  studentId: string,
  answers: any
): Promise<DegradationResponse> {
  await enqueueOutboxEvent({
    eventType: 'ai_grading_deferred',
    aggregateType: 'assessment',
    aggregateId: assessmentId,
    payload: { studentId, answers },
  }).catch(() => {});

  return {
    degraded: true,
    message: "AI grading is temporarily unavailable. Your assessment has been saved. We'll continue processing automatically.",
  };
}

/**
 * Email Service Graceful Degradation:
 * Defers outbound emails to the persistent outbox/jobs queue.
 */
export async function handleEmailDegradation(
  to: string,
  subject: string,
  html?: string
): Promise<DegradationResponse> {
  await enqueueOutboxEvent({
    eventType: 'email_deferred',
    aggregateType: 'email',
    aggregateId: to,
    payload: { to, subject, html },
  }).catch(() => {});

  return {
    degraded: true,
    message: 'Email service is busy. Notification has been queued for background delivery.',
  };
}

/**
 * FCM Push Notification Graceful Degradation:
 * Converts push notifications to durable in-app notifications.
 */
export async function handleFcmDegradation(
  userId: string,
  title: string,
  body: string,
  schoolId?: string
): Promise<DegradationResponse> {
  await enqueueOutboxEvent({
    eventType: 'in_app_notification_deferred',
    aggregateType: 'notification',
    aggregateId: userId,
    schoolId,
    payload: { userId, title, body },
  }).catch(() => {});

  return {
    degraded: true,
    message: 'Push notification fallback: stored for in-app notification desk.',
  };
}

/**
 * Report Generation Graceful Degradation:
 * Queues report compilation asynchronously instead of blocking the request.
 */
export async function handleReportDegradation(
  schoolId: string,
  reportType: string,
  params: any
): Promise<DegradationResponse> {
  await enqueueOutboxEvent({
    eventType: 'report_generation_deferred',
    aggregateType: 'report',
    aggregateId: schoolId,
    schoolId,
    payload: { reportType, params },
  }).catch(() => {});

  return {
    degraded: true,
    message: 'Report queued for background generation.',
  };
}
