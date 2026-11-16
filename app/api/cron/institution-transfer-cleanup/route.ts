import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { institutionTransferRequest } from '@/lib/db/schema'
import { and, eq, isNull, lte } from 'drizzle-orm'
import { cleanupInstitutionTransfer } from '@/lib/transfers/cleanup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const due = await db.query.institutionTransferRequest.findMany({ where: and(eq(institutionTransferRequest.status, 'APPROVED'), isNull(institutionTransferRequest.cleanedAt), lte(institutionTransferRequest.cleanupAfter, new Date())), limit: 100 })
  const results = await Promise.all(due.map((item) => cleanupInstitutionTransfer(item.id)))
  return NextResponse.json({ success: true, cleaned: results.filter(Boolean).length })
}
