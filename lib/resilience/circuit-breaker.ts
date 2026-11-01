export type CircuitStateEnum = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number; // Failures before opening (default: 5)
  recoveryTimeMs?: number; // Time spent in OPEN before HALF_OPEN probe (default: 30s)
  halfOpenMaxCalls?: number; // Max trial probes in HALF_OPEN (default: 2)
}

export interface CircuitStatus {
  name: string;
  state: CircuitStateEnum;
  failures: number;
  lastFailureTime?: number;
  openedAt?: number;
}

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly circuitName: string) {
    super(`Circuit breaker for '${circuitName}' is OPEN. Fast failing request.`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  readonly name: string;
  readonly failureThreshold: number;
  readonly recoveryTimeMs: number;
  readonly halfOpenMaxCalls: number;

  private state: CircuitStateEnum = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private openedAt = 0;
  private halfOpenCalls = 0;

  constructor(name: string, config: CircuitBreakerConfig = {}) {
    this.name = name;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.recoveryTimeMs = config.recoveryTimeMs ?? 30_000;
    this.halfOpenMaxCalls = config.halfOpenMaxCalls ?? 2;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now - this.openedAt >= this.recoveryTimeMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
      } else {
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new CircuitBreakerOpenError(this.name);
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls += 1;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.halfOpenCalls = 0;
  }

  private onFailure() {
    this.failures += 1;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }

  getStatus(): CircuitStatus {
    const now = Date.now();
    let effectiveState = this.state;
    if (this.state === 'OPEN' && now - this.openedAt >= this.recoveryTimeMs) {
      effectiveState = 'HALF_OPEN';
    }

    return {
      name: this.name,
      state: effectiveState,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime || undefined,
      openedAt: this.openedAt || undefined,
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.openedAt = 0;
    this.halfOpenCalls = 0;
  }
}

// Registry of independent breakers per dependency
const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
  let breaker = breakers.get(name);
  if (!breaker) {
    breaker = new CircuitBreaker(name, config);
    breakers.set(name, breaker);
  }
  return breaker;
}

export function getAllCircuitBreakersStatus(): CircuitStatus[] {
  return Array.from(breakers.values()).map((b) => b.getStatus());
}
