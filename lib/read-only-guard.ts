import { NextRequest, NextResponse } from 'next/server'
import { isSystemFeatureEnabled } from '@/lib/resilience/feature-flags'

const READ_ONLY_EXEMPT_PATHS = [
  '/api/auth',
  '/auth/',
  '/api/health',
  '/api/setup-admin',
]

/**
 * Validates whether the system is in read-only mode and restricts mutation requests.
 */
export async function handleReadOnlyGuard(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null
  }

  const pathname = request.nextUrl.pathname
  const isExempt = READ_ONLY_EXEMPT_PATHS.some((p) => pathname.startsWith(p))
  if (isExempt) {
    return null
  }

  // Read-only mode check designed for edge and proxy runtime:
  // Check fast environment flags first, then query database if running in Node.js runtime
  const envReadOnly = process.env.READ_ONLY_MODE === 'true' || process.env.MAINTENANCE_MODE === 'true'
  if (envReadOnly) {
    return NextResponse.json(
      {
        error: 'System is currently in Read-Only Mode for scheduled maintenance. Updates are temporarily paused.',
        code: 'READ_ONLY_MODE',
      },
      { status: 503 }
    )
  }

  // If in Node.js environment, check dynamic DB-backed feature flag
  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.release?.name === 'node') {
    try {
      const isReadOnly = await isSystemFeatureEnabled('read_only_mode')
      if (isReadOnly) {
        return NextResponse.json(
          {
            error: 'System is currently in Read-Only Mode for scheduled maintenance. Updates are temporarily paused.',
            code: 'READ_ONLY_MODE',
          },
          { status: 503 }
        )
      }
    } catch {
      // Safe fallback: do not block if DB lookup fails
    }
  }

  return null
}
