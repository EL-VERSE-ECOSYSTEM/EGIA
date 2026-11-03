import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/resilience/health'

/**
 * /api/health/ready
 * Readiness Probe: Answers "Can this instance safely serve traffic?"
 * Checks primary database connectivity.
 */
export async function GET() {
  const dbHealth = await checkDatabaseHealth()

  if (dbHealth !== 'healthy') {
    return NextResponse.json(
      {
        status: 'unready',
        database: dbHealth,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    status: 'ready',
    database: 'healthy',
    timestamp: new Date().toISOString(),
  })
}
