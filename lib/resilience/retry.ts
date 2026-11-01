import { calculateBackoffWithJitter, isRetryableError } from '@/workers/utils/retry'

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Executes an operation with exponential backoff and jitter.
 * Skips retries if the error is permanent/non-retryable.
 */
export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 10000;
  const customShouldRetry = options.shouldRetry;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error: any) {
      lastError = error;

      const canRetry = customShouldRetry
        ? customShouldRetry(error)
        : isRetryableError(error);

      if (!canRetry || attempt >= maxAttempts) {
        throw error;
      }

      const delay = calculateBackoffWithJitter(attempt, baseDelayMs, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export { calculateBackoffWithJitter, isRetryableError }
