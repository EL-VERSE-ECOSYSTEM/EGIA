import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allocatePaymentAcrossInstallments,
  createInstallmentDueDates,
  INSTALLMENTS_PER_TERM,
  splitAmountIntoInstallments,
} from '../lib/payments/installments'

test('term fee is split into 18 cent-accurate installments', () => {
  const amounts = splitAmountIntoInstallments(1000)
  assert.equal(amounts.length, INSTALLMENTS_PER_TERM)
  assert.equal(amounts.reduce((sum, amount) => sum + Math.round(Number(amount) * 100), 0), 100_000)
  assert.equal(amounts[0], '55.56')
  assert.equal(amounts.at(-1), '55.55')
})

test('manual payments are applied oldest-first and preserve partial balances', () => {
  const result = allocatePaymentAcrossInstallments([
    { id: 'one', amount: '20.00', paidAmount: '0.00', status: 'pending' },
    { id: 'two', amount: '20.00', paidAmount: '5.00', status: 'partial' },
  ], 25)

  assert.deepEqual(result.updates, [
    { id: 'one', paidAmount: '20.00', status: 'paid', isPaid: true },
    { id: 'two', paidAmount: '10.00', status: 'partial', isPaid: false },
  ])
  assert.equal(result.unappliedAmount, 0)
})

test('installment dates cover the term without exceeding its end date', () => {
  const dates = createInstallmentDueDates(
    new Date('2026-09-01T00:00:00.000Z'),
    new Date('2026-12-01T00:00:00.000Z'),
  )
  assert.equal(dates.length, INSTALLMENTS_PER_TERM)
  assert.equal(dates[0], '2026-09-01')
  assert.equal(dates.at(-1), '2026-12-01')
  assert.ok(dates.every((date, index) => index === 0 || date >= dates[index - 1]))
})

test('invalid installment amounts and date ranges are rejected', () => {
  assert.throws(() => splitAmountIntoInstallments(0))
  assert.throws(() => splitAmountIntoInstallments(0.1, 18))
  assert.throws(() => createInstallmentDueDates(
    new Date('2026-12-02T00:00:00.000Z'),
    new Date('2026-12-01T00:00:00.000Z'),
  ))
})
