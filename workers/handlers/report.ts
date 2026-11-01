import { JobHandler } from '../registry'

export const reportHandler: JobHandler = async (payload) => {
  const { schoolId, term, session, studentId } = payload
  if (!schoolId) {
    throw new Error('Malformed report payload: missing schoolId')
  }

  return {
    status: 'GENERATED',
    schoolId,
    term,
    session,
    studentId,
    generatedAt: new Date().toISOString(),
  }
}
