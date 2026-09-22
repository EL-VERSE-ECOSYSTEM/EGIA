import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { timingSafeCompare } from '../app/api/setup-admin/route'

describe('setup-admin secret timing-safe authentication', () => {
  const EXPECTED_SECRET = 'super-secret-admin-token-12345'

  it('should return true for an exact matching secret token', () => {
    const result = timingSafeCompare(EXPECTED_SECRET, EXPECTED_SECRET)
    assert.equal(result, true)
  })

  it('should return false when received secret is null', () => {
    const result = timingSafeCompare(null, EXPECTED_SECRET)
    assert.equal(result, false)
  })

  it('should return false when received secret is empty string', () => {
    const result = timingSafeCompare('', EXPECTED_SECRET)
    assert.equal(result, false)
  })

  it('should return false for mismatched secret tokens of equal length', () => {
    const wrongSecret = 'super-secret-admin-token-12349'
    const result = timingSafeCompare(wrongSecret, EXPECTED_SECRET)
    assert.equal(result, false)
  })

  it('should return false for mismatched secret tokens of different lengths', () => {
    const wrongSecret = 'super-secret-admin'
    const result = timingSafeCompare(wrongSecret, EXPECTED_SECRET)
    assert.equal(result, false)
  })
})
