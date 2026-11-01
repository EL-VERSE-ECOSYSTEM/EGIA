import { NextResponse } from 'next/server'

/**
 * /api/health/live
 * Process Liveness Probe: Answers "Is the application process alive?"
 * Does NOT query the database, ensuring zero false-positive restarts.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    timestamp: new Date().toISOString(),
  })
}
