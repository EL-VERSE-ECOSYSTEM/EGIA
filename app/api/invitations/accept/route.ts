import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invitations, user, userRole, teacher, parent, student } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password, name, firstName, lastName } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
    }

    const records = await db.select().from(invitations).where(eq(invitations.token, token))
    if (records.length === 0) {
      return NextResponse.json({ error: 'Invalid invitation token.' }, { status: 404 })
    }

    const invitation = records[0]
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Invitation has already been accepted.' }, { status: 400 })
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await db.update(invitations).set({ status: 'EXPIRED' }).where(eq(invitations.id, invitation.id))
      return NextResponse.json({ error: 'Invitation token has expired.' }, { status: 400 })
    }

    const userId = randomUUID()
    const email = invitation.email || `${invitation.phone || 'user'}@school.com`
    const userRoleType = invitation.role || 'TEACHER'

    // Create user record
    await db.insert(user).values({
      id: userId,
      email,
      name: name || `${firstName || 'Invited'} ${lastName || 'User'}`,
      schoolId: invitation.schoolId,
      password
    })

    // Create user role record
    await db.insert(userRole).values({
      id: randomUUID(),
      userId,
      role: userRoleType
    })

    // Role-specific records
    if (userRoleType === 'TEACHER') {
      await db.insert(teacher).values({
        id: randomUUID(),
        userId,
        schoolId: invitation.schoolId,
        firstName: firstName || 'Teacher',
        lastName: lastName || 'Staff',
        staffCode: `ST-${Math.floor(10000 + Math.random() * 90000)}`,
        password,
        status: 'ACTIVE'
      })
    } else if (userRoleType === 'PARENT') {
      await db.insert(parent).values({
        id: randomUUID(),
        userId,
        schoolId: invitation.schoolId,
        firstName: firstName || 'Parent',
        lastName: lastName || 'Guardian',
        phoneNumber: invitation.phone || null,
        password
      })
    } else if (userRoleType === 'STUDENT') {
      await db.insert(student).values({
        id: randomUUID(),
        userId,
        schoolId: invitation.schoolId,
        firstName: firstName || 'Student',
        lastName: lastName || 'Pupil',
        class: 'JSS1',
        admissionNumber: `STU-${Math.floor(10000 + Math.random() * 90000)}`,
        password,
        registrationStatus: 'ACTIVE'
      })
    }

    // Mark invitation as ACCEPTED
    await db.update(invitations).set({ status: 'ACCEPTED' }).where(eq(invitations.id, invitation.id))

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully! You can now log in.',
      role: userRoleType
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: error.message || 'Failed to accept invitation' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 })
    }

    const records = await db.select().from(invitations).where(eq(invitations.token, token))
    if (records.length === 0) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, invitation: records[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invitation details' }, { status: 500 })
  }
}
