import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invitations } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { schoolId, email, phone, role, invitedBy } = body

    if (!schoolId || (!email && !phone) || !role) {
      return NextResponse.json({ error: 'School ID, role, and email or phone are required.' }, { status: 400 })
    }

    const token = `inv-${randomUUID()}`
    const id = randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(invitations).values({
      id,
      schoolId,
      email: email || null,
      phone: phone || null,
      role,
      token,
      status: 'PENDING',
      expiresAt,
      invitedBy: invitedBy || 'School Admin'
    })

    const inviteLink = `http://localhost:3000/invite/${token}`

    return NextResponse.json({
      success: true,
      invitation: {
        id,
        token,
        inviteLink,
        expiresAt
      }
    })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: error.message || 'Failed to create invitation' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')

    let list
    if (schoolId) {
      list = await db.select().from(invitations).where(eq(invitations.schoolId, schoolId)).orderBy(desc(invitations.createdAt))
    } else {
      list = await db.select().from(invitations).orderBy(desc(invitations.createdAt))
    }

    return NextResponse.json({ success: true, data: list })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invitations' }, { status: 500 })
  }
}
