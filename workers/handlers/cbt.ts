import { JobHandler } from '../registry'

export const cbtHandler: JobHandler = async (payload) => {
  const { sessionId, studentId, assessmentId } = payload
  if (!sessionId || !studentId) {
    throw new Error('Malformed CBT payload: missing sessionId or studentId')
  }

  return {
    sessionId,
    studentId,
    assessmentId,
    status: 'PROCESSED',
    processedAt: new Date().toISOString(),
  }
}
