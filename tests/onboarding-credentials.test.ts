import assert from 'node:assert/strict'
import test from 'node:test'
import { generateTemporaryPassword } from '@/lib/onboarding-credentials'

test('temporary passwords contain a three-digit code with distinct digits', () => {
  for (let index = 0; index < 100; index += 1) {
    const password = generateTemporaryPassword()
    const code = password.match(/^ELlearn@(\d{3})-/)?.[1]

    assert.ok(code)
    assert.equal(new Set(code).size, 3)
    assert.match(password, /^ELlearn@\d{3}-[A-Za-z]{10}$/)
  }
})

test('temporary password codes are unique within a batch', () => {
  const usedCodes = new Set<string>()
  for (let index = 0; index < 100; index += 1) {
    const password = generateTemporaryPassword(usedCodes)
    const code = password.match(/^ELlearn@(\d{3})-/)?.[1]
    assert.ok(code)
  }

  assert.equal(usedCodes.size, 100)
})
