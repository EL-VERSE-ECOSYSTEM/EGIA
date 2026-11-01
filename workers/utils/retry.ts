/**
 * Calculates exponential backoff with random jitter.
 * Formula: min(maxDelayMs, baseDelayMs * 2^(attempt - 1)) + jitter
 */
export function calculateBackoffWithJitter(
  attempt: number,
  baseDelayMs = 5000,
  maxDelayMs = 600000 // 10 minutes max
): number {
  const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)));
  const jitter = Math.random() * (exponential * 0.2); // 20% jitter
  return Math.floor(exponential + jitter);
}

/**
 * Classifies if an error is permanently fatal or transiently retryable.
 * Non-retryable: validation, auth, permissions, known duplicates.
 */
export function isRetryableError(error: any): boolean {
  if (!error) return true;

  const msg = (error.message || String(error)).toLowerCase();
  const permanentPatterns = [
    'invalid credentials',
    'permission denied',
    'unauthorized',
    'forbidden',
    'validation failed',
    'schema error',
    'already exists',
    'not found',
    'malformed',
    'bad request',
  ];

  for (const pattern of permanentPatterns) {
    if (msg.includes(pattern)) return false;
  }

  // Transient network, DB lock, rate limits, timeouts are retryable
  return true;
}
