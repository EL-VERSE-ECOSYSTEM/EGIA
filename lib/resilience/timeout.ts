export class TimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms.`);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps an async function or promise within a strict timeout boundary.
 * Supports AbortSignal to propagate cancellation to downstream HTTP requests.
 */
export async function withTimeout<T>(
  action: (signal?: AbortSignal) => Promise<T>,
  timeoutMs: number,
  operationName = 'Operation'
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([action(controller.signal), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
