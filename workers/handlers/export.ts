import { JobHandler } from '../registry'

export const exportHandler: JobHandler = async (payload) => {
  const { schoolId, exportType } = payload
  if (!schoolId || !exportType) {
    throw new Error('Malformed export payload: missing schoolId or exportType')
  }

  return {
    status: 'EXPORTED',
    schoolId,
    exportType,
    url: `/exports/${schoolId}_${exportType}_${Date.now()}.csv`,
    completedAt: new Date().toISOString(),
  }
}
