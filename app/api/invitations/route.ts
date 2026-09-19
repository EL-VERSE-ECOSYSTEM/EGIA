import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invitations, user as userTable, schoolAdminRoles } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'

const ALLOWED_INVITE_ROLES = ['TEACHER', 'PARENT', 'STUDENT']

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const role = (session.user.role || '').toUpperCase()
    if (!['PRIMARY_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient invitation privileges.' }, { status: 403 })
    }

    let schoolId = session.user.schoolId
    if (!schoolId && role !== 'SUPER_ADMIN') {
      const uRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
      schoolId = uRec?.schoolId || null
    }

    const body = await req.json()
    const { email, phone, role: inviteRole, schoolId: bodySchoolId } = body

    const targetSchoolId = role === 'SUPER_ADMIN' ? (bodySchoolId || schoolId) : schoolId
    if (!targetSchoolId) {
      return NextResponse.json({ error: 'School ID context is required for creating invitations.' }, { status: 400 })
    }

    if (!email && !phone) {
      return NextResponse.json({ error: 'Recipient email or phone number is required.' }, { status: 400 })
    }

    const normalizedRole = (inviteRole || 'TEACHER').toUpperCase()
    if (!ALLOWED_INVITE_ROLES.includes(normalizedRole)) {
      return NextResponse.json({ error: `Invalid invitation role. Allowed roles: ${ALLOWED_INVITE_ROLES.join(', ')}` }, { status: 400 })
    }

    const token = `inv-${randomUUID()}`
    const id = randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(invitations).values({
      id,
      schoolId: targetSchoolId,
      email: email ? email.trim().toLowerCase() : null,
      phone: phone ? phone.trim() : null,
      role: normalizedRole,
      token,
      status: 'PENDING',
      expiresAt,
      invitedBy: session.user.id
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL || 'http://localhost:3000'
    const inviteLink = `${siteUrl.replace(/\/$/, '')}/invite/${token}`

    return NextResponse.json({
      success: true,
      invitation: {
        id,
        inviteLink,
        expiresAt
      }
    })
  } catch (error: any) {
    console.error('Error creating invitation:', { requestId, error: error?.message || error })
    return NextResponse.json({ error: 'Unable to create invitation. Please try again.', requestId }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const requestId = randomUUID()
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const role = (session.user.role || '').toUpperCase()
    if (!['PRIMARY_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const bodySchoolId = searchParams.get('schoolId')

    let schoolId = session.user.schoolId
    if (!schoolId && role !== 'SUPER_ADMIN') {
      const uRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
      schoolId = uRec?.schoolId || null
    }

    const targetSchoolId = role === 'SUPER_ADMIN' ? (bodySchoolId || schoolId) : schoolId

    let list
    if (targetSchoolId) {
      list = await db.select().from(invitations).where(eq(invitations.schoolId, targetSchoolId)).orderBy(desc(invitations.createdAt)).limit(100)
    } else {
      if (role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'School ID parameter required.' }, { status: 400 })
      }
      list = await db.select().from(invitations).orderBy(desc(invitations.createdAt)).limit(100)
    }

    const maskedList = list.map(inv => ({
      id: inv.id,
      schoolId: inv.schoolId,
      email: inv.email,
      phone: inv.phone,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      invitedBy: inv.invitedBy,
      createdAt: inv.createdAt,
    }))

    return NextResponse.json({ success: true, data: maskedList })
  } catch (error: any) {
    console.error('Error fetching invitations:', { requestId, error: error?.message || error })
    return NextResponse.json({ error: 'Unable to fetch invitations. Please try again.', requestId }, { status: 500 })
  }
}
