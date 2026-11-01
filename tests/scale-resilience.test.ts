import { describe, expect, it } from 'node:test'
import { withTimeout } from '../lib/resilience/circuit-breaker'

describe('EGIA resilience utilities', () => {
  it('times out slow operations', async () => {
    await expect(withTimeout(async (signal) => {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 100)
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new Error('aborted'))
        })
      })
      return true
    }, 5)).rejects.toThrow()
  })
})
