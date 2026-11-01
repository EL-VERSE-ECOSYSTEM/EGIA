import { randomUUID } from 'crypto'

export function generateTraceId(): string {
  return `trace_${Date.now()}_${randomUUID().slice(0, 8)}`
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${randomUUID().slice(0, 8)}`
}
