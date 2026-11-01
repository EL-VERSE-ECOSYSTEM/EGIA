import { NextResponse } from 'next/server'
import { checkAllDependenciesHealth } from '@/lib/resilience/health'

/**
 * /api/health/dependencies
 * Comprehensive health inspection for all platform dependencies.
 * Never exposes credentials or secrets.
 */
export async function GET() {
  const result = await checkAllDependenciesHealth()
  const httpStatus = result.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(result, { status: httpStatus })
}
