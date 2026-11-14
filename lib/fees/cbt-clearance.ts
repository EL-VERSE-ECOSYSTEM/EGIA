export const CBT_FEE_CLEARANCE_PERCENTAGE = 75

export interface FeeScheduleItem {
  feeType: string
  department: string | null
  amount: string | number
}

export interface FeePayment {
  feeType: string | null
  amount: string | number
  status: string | null
}

export interface CbtFeeClearance {
  totalDue: number
  totalPaid: number
  paidPercentage: number
  requiredPercentage: number
  eligible: boolean
}

const successfulPaymentStatuses = new Set(['success', 'approved', 'cleared'])

export function getCbtFeeClearance(
  feeSchedule: FeeScheduleItem[],
  payments: FeePayment[],
  department: string | null,
): CbtFeeClearance {
  const applicableFees = new Map<string, FeeScheduleItem>()
  for (const fee of feeSchedule) {
    if (fee.department && fee.department.toLowerCase() !== department?.toLowerCase()) continue
    const feeKey = fee.feeType.trim().toLowerCase()
    const currentFee = applicableFees.get(feeKey)
    if (!currentFee || (fee.department && fee.department.toLowerCase() === department?.toLowerCase())) {
      applicableFees.set(feeKey, fee)
    }
  }

  const totalDue = [...applicableFees.values()].reduce(
    (total, fee) => total + Math.max(Number(fee.amount) || 0, 0),
    0,
  )
  const totalPaid = payments.reduce((total, payment) => {
    if (!successfulPaymentStatuses.has((payment.status || '').toLowerCase())) return total
    if (!payment.feeType || !applicableFees.has(payment.feeType.trim().toLowerCase())) return total
    return total + Math.max(Number(payment.amount) || 0, 0)
  }, 0)
  const paidPercentage = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 100

  return {
    totalDue,
    totalPaid,
    paidPercentage,
    requiredPercentage: CBT_FEE_CLEARANCE_PERCENTAGE,
    eligible: totalDue === 0 || totalPaid >= totalDue * (CBT_FEE_CLEARANCE_PERCENTAGE / 100),
  }
}
