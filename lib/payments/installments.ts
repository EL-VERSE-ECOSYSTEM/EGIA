export const INSTALLMENTS_PER_TERM = 18

export type InstallmentBalance = {
  id: string
  amount: string | number
  paidAmount: string | number | null
  status: string | null
}

export function allocatePaymentAcrossInstallments(installments: InstallmentBalance[], amount: number) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Payment allocation amount must be non-negative.')
  let unappliedCents = Math.round(amount * 100)
  const updates: Array<{ id: string; paidAmount: string; status: 'paid' | 'partial'; isPaid: boolean }> = []

  for (const installment of installments) {
    if (unappliedCents <= 0) break
    if (installment.status === 'paid') continue
    const totalCents = Math.max(0, Math.round(Number(installment.amount) * 100))
    const paidCents = Math.min(totalCents, Math.max(0, Math.round(Number(installment.paidAmount || 0) * 100)))
    const outstandingCents = totalCents - paidCents
    const appliedCents = Math.min(outstandingCents, unappliedCents)
    if (appliedCents <= 0) continue

    const nextPaidCents = paidCents + appliedCents
    const isPaid = nextPaidCents >= totalCents
    updates.push({
      id: installment.id,
      paidAmount: (nextPaidCents / 100).toFixed(2),
      status: isPaid ? 'paid' : 'partial',
      isPaid,
    })
    unappliedCents -= appliedCents
  }

  return { updates, unappliedAmount: unappliedCents / 100 }
}

export function splitAmountIntoInstallments(totalAmount: number, count = INSTALLMENTS_PER_TERM) {
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Installment count must be a positive integer.')
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) throw new Error('Total fee must be a positive amount.')

  const totalKobo = Math.round(totalAmount * 100)
  if (!Number.isSafeInteger(totalKobo) || totalKobo < count) {
    throw new Error('The fee amount is too small to split into installments.')
  }

  const baseKobo = Math.floor(totalKobo / count)
  const remainderKobo = totalKobo % count
  return Array.from({ length: count }, (_, index) =>
    ((baseKobo + (index < remainderKobo ? 1 : 0)) / 100).toFixed(2),
  )
}

export function createInstallmentDueDates(startDate: Date, endDate: Date, count = INSTALLMENTS_PER_TERM) {
  if (!Number.isSafeInteger(count) || count < 1) throw new Error('Installment count must be a positive integer.')
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new Error('The installment date range is invalid.')
  }

  const interval = end - start
  return Array.from({ length: count }, (_, index) => {
    const timestamp = start + Math.ceil((interval * index) / Math.max(1, count - 1))
    return new Date(timestamp).toISOString().slice(0, 10)
  })
}
