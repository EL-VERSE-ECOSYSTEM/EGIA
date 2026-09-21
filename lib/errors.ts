import { randomUUID } from 'crypto'

export interface SafeActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  requestId?: string
}

export function sanitizeServerError(
  operation: string,
  error: unknown,
  fallbackMessage = 'We could not complete that request. Please try again.'
): { success: false; error: string; requestId: string } {
  const requestId = randomUUID()
  const detailedError = error instanceof Error ? error.message : String(error)

  console.error(`[SERVER ERROR] ${operation}`, {
    requestId,
    error: detailedError,
    stack: error instanceof Error ? error.stack : undefined,
  })

  return {
    success: false,
    error: fallbackMessage,
    requestId,
  }
}
