type CircuitOptions = {
  failureThreshold?: number;
  recoveryTimeMs?: number;
  timeoutMs?: number;
};

type CircuitState = {
  failures: number;
  openedUntil: number;
};

const circuitStates = new Map<string, CircuitState>();

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`${name} is temporarily unavailable. Please try again shortly.`);
    this.name = "CircuitBreakerOpenError";
  }
}

export async function withCircuitBreaker<T>(
  name: string,
  operation: () => Promise<T>,
  options: CircuitOptions = {},
) {
  const failureThreshold = options.failureThreshold ?? 3;
  const recoveryTimeMs = options.recoveryTimeMs ?? 30_000;
  const timeoutMs = options.timeoutMs ?? 20_000;
  const state = circuitStates.get(name) ?? { failures: 0, openedUntil: 0 };
  const now = Date.now();

  if (state.openedUntil > now) {
    throw new CircuitBreakerOpenError(name);
  }

  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${name} timed out.`)), timeoutMs);
      }),
    ]);
    circuitStates.set(name, { failures: 0, openedUntil: 0 });
    return result;
  } catch (error) {
    const failures = state.failures + 1;
    circuitStates.set(name, {
      failures,
      openedUntil: failures >= failureThreshold ? now + recoveryTimeMs : 0,
    });
    throw error;
  }
}

type QueueOptions = {
  concurrency?: number;
  maxSize?: number;
};

export class AsyncMessageQueue {
  private pending: Array<() => Promise<void>> = [];
  private running = 0;
  private readonly concurrency: number;
  private readonly maxSize: number;

  constructor(
    readonly name: string,
    options: QueueOptions = {},
  ) {
    this.concurrency = options.concurrency ?? 1;
    this.maxSize = options.maxSize ?? 500;
  }

  enqueue<T>(task: () => Promise<T> | T) {
    if (this.pending.length >= this.maxSize) {
      return Promise.reject(new Error(`${this.name} queue is full.`));
    }

    return new Promise<T>((resolve, reject) => {
      this.pending.push(async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        }
      });
      this.drain();
    });
  }

  private drain() {
    while (this.running < this.concurrency && this.pending.length > 0) {
      const next = this.pending.shift();
      if (!next) return;
      this.running += 1;
      void next().finally(() => {
        this.running -= 1;
        this.drain();
      });
    }
  }
}

export function createMessageQueue(name: string, options?: QueueOptions) {
  return new AsyncMessageQueue(name, options);
}
