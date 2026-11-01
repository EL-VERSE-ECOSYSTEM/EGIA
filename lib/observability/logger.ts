import { getRequestContext } from './request-context'

const SENSITIVE_KEYS = new Set([
  'password',
  'otp',
  'token',
  'authorization',
  'secret',
  'secretkey',
  'apikey',
  'cardnumber',
  'cvv',
  'pin',
])

function redact(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(redact)

  const sanitized: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof val === 'object') {
      sanitized[key] = redact(val)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

export const logger = {
  info(message: string, meta: Record<string, any> = {}) {
    const ctx = getRequestContext()
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        requestId: ctx?.requestId,
        traceId: ctx?.traceId,
        userId: ctx?.userId,
        schoolId: ctx?.schoolId,
        meta: redact(meta),
      })
    )
  },

  warn(message: string, meta: Record<string, any> = {}) {
    const ctx = getRequestContext()
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        requestId: ctx?.requestId,
        traceId: ctx?.traceId,
        userId: ctx?.userId,
        schoolId: ctx?.schoolId,
        meta: redact(meta),
      })
    )
  },

  error(message: string, error?: any, meta: Record<string, any> = {}) {
    const ctx = getRequestContext()
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        errorMessage: error?.message || String(error),
        timestamp: new Date().toISOString(),
        requestId: ctx?.requestId,
        traceId: ctx?.traceId,
        userId: ctx?.userId,
        schoolId: ctx?.schoolId,
        meta: redact(meta),
      })
    )
  },
}
