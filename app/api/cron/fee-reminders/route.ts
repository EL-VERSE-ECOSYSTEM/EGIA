import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { sendScheduledFeeReminders } from '@/lib/fees/scheduled-reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization') || ''
  if (!secret || !authorization.startsWith('Bearer ')) return false
  const provided = Buffer.from(authorization.slice(7))
  const expected = Buffer.from(secret)
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendScheduledFeeReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Scheduled school-fee reminder job failed:', error)
    return NextResponse.json({ error: 'Fee reminder job failed.' }, { status: 500 })
  }
}
