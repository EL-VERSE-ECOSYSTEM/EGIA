import { JobHandler } from '../registry'

export const paymentReconciliationHandler: JobHandler = async (payload) => {
  const { paymentReference, schoolId } = payload
  if (!paymentReference) {
    throw new Error('Malformed reconciliation payload: missing paymentReference')
  }

  return {
    paymentReference,
    schoolId,
    status: 'RECONCILED',
    reconciledAt: new Date().toISOString(),
  }
}
