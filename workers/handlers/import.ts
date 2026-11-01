import { JobHandler } from '../registry'

export const importHandler: JobHandler = async (payload) => {
  const { schoolId, importType, rows } = payload
  if (!schoolId || !Array.isArray(rows)) {
    throw new Error('Malformed import payload: missing schoolId or rows array')
  }

  return {
    status: 'IMPORTED',
    schoolId,
    importType,
    processedRows: rows.length,
    completedAt: new Date().toISOString(),
  }
}
