import test from 'node:test'
import assert from 'node:assert/strict'
import { CircuitBreaker, CircuitBreakerOpenError } from '../../lib/resilience/circuit-breaker'
import { withTimeout, TimeoutError } from '../../lib/resilience/timeout'
import { calculateBackoffWithJitter, isRetryableError } from '../../lib/resilience/retry'
import { Bulkhead, BulkheadRejectedError } from '../../lib/resilience/bulkhead'
import { hashPayload } from '../../lib/idempotency'

test('Circuit Breaker state transitions and fast-failure', async () => {
  const breaker = new CircuitBreaker('test-service', {
    failureThreshold: 2,
    recoveryTimeMs: 50,
  })

  assert.equal(breaker.getStatus().state, 'CLOSED')

  // Failure 1
  await assert.rejects(
    () => breaker.execute(async () => { throw new Error('Network failure') }),
    { message: 'Network failure' }
  )
  assert.equal(breaker.getStatus().state, 'CLOSED')

  // Failure 2 -> Trips to OPEN
  await assert.rejects(
    () => breaker.execute(async () => { throw new Error('Network failure') }),
    { message: 'Network failure' }
  )
  assert.equal(breaker.getStatus().state, 'OPEN')

  // In OPEN state, fast fails without invoking function
  let called = false
  await assert.rejects(
    () => breaker.execute(async () => { called = true; return 'ok' }),
    (err: any) => err instanceof CircuitBreakerOpenError
  )
  assert.equal(called, false)

  // Wait for recovery timeout -> Transitions to HALF_OPEN
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(breaker.getStatus().state, 'HALF_OPEN')

  // Successful probe resets to CLOSED
  const result = await breaker.execute(async () => 'recovered')
  assert.equal(result, 'recovered')
  assert.equal(breaker.getStatus().state, 'CLOSED')
})

test('Timeout policy with AbortSignal cancellation', async () => {
  await assert.rejects(
    () =>
      withTimeout(
        async (signal) => {
          await new Promise((_, reject) => {
            signal?.addEventListener('abort', () => reject(new Error('Aborted!')))
          })
        },
        30,
        'Slow external call'
      ),
    (err: any) => err instanceof TimeoutError || err.message.includes('Aborted')
  )
})

test('Exponential backoff with jitter and error classification', () => {
  const delay1 = calculateBackoffWithJitter(1, 1000)
  const delay2 = calculateBackoffWithJitter(2, 1000)
  const delay3 = calculateBackoffWithJitter(3, 1000)

  assert.ok(delay1 >= 1000)
  assert.ok(delay2 >= 2000)
  assert.ok(delay3 >= 4000)

  // Transient network is retryable
  assert.equal(isRetryableError(new Error('Connection reset by peer')), true)
  assert.equal(isRetryableError(new Error('Database lock timeout')), true)

  // Permanent errors are NOT retryable
  assert.equal(isRetryableError(new Error('Unauthorized access')), false)
  assert.equal(isRetryableError(new Error('Forbidden resource')), false)
  assert.equal(isRetryableError(new Error('Validation failed for field email')), false)
})

test('Bulkhead isolation restricts concurrent executions and queues safely', async () => {
  const bulkhead = new Bulkhead('test-pool', { maxConcurrent: 1, maxQueue: 1 })

  let task1Resolve: () => void
  const task1Promise = new Promise<void>((r) => { task1Resolve = r })

  // Task 1 occupies active slot
  const p1 = bulkhead.execute(async () => {
    await task1Promise
    return 't1'
  })

  // Task 2 occupies queue slot
  const p2 = bulkhead.execute(async () => 't2')

  // Task 3 exceeds capacity and is rejected immediately
  await assert.rejects(
    () => bulkhead.execute(async () => 't3'),
    (err: any) => err instanceof BulkheadRejectedError
  )

  task1Resolve!()
  const res1 = await p1
  const res2 = await p2
  assert.equal(res1, 't1')
  assert.equal(res2, 't2')
})

test('Payload hashing produces deterministic idempotency digests', () => {
  const hash1 = hashPayload({ amount: 5000, schoolId: 'SCH1', ref: 'ABC' })
  const hash2 = hashPayload({ amount: 5000, schoolId: 'SCH1', ref: 'ABC' })
  const hash3 = hashPayload({ amount: 5001, schoolId: 'SCH1', ref: 'ABC' })

  assert.equal(hash1, hash2)
  assert.notEqual(hash1, hash3)
})
