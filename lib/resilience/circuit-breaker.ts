type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

type BreakerConfig = {
  failureThreshold?: number
  cooldownMs?: number
}

const breakers = new Map<string, { state: State; failures: number; openedAt: number }>()

export async function withCircuitBreaker<T>(
  name: string,
  operation: () => Promise<T>,
  config: BreakerConfig = {},
): Promise<T> {
  const threshold = config.failureThreshold ?? 5
  const cooldownMs = config.cooldownMs ?? 30_000
  const current = breakers.get(name) ?? { state: 'CLOSED' as State, failures: 0, openedAt: 0 }

  if (current.state === 'OPEN') {
    if (Date.now() - current.openedAt < cooldownMs) {
      throw new Error(`Circuit ${name} is open`)
    }
    current.state = 'HALF_OPEN'
  }

  try {
    const result = await operation()
    current.failures = 0
    current.state = 'CLOSED'
    breakers.set(name, current)
    return result
  } catch (error) {
    current.failures += 1
    if (current.failures >= threshold) {
      current.state = 'OPEN'
      current.openedAt = Date.now()
    }
    breakers.set(name, current)
    throw error
  }
}

export async function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await operation(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}
