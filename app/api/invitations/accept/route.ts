import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invitations, user as userTable, userRole, teacher, parent, student } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password, name, firstName, lastName, gender } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 })
    }

    const now = new Date()
    const records = await db.select().from(invitations).where(
      and(
        eq(invitations.token, token),
        eq(invitations.status, 'PENDING')
      )
    )

    if (records.length === 0) {
      return NextResponse.json({ error: 'Invalid or already accepted invitation token.' }, { status: 400 })
    }

    const invitation = records[0]
    if (new Date(invitation.expiresAt) < now) {
      await db.update(invitations).set({ status: 'EXPIRED' }).where(eq(invitations.id, invitation.id))
      return NextResponse.json({ error: 'Invitation token has expired.' }, { status: 400 })
    }

    const email = (invitation.email || body.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required to complete invitation acceptance.' }, { status: 400 })
    }

    const userRoleType = invitation.role || 'TEACHER'
    let userId = randomUUID() as `${string}-${string}-${string}-${string}-${string}`

    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (secretKey) {
      const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
      const adminClient = createSupabaseAdminClient(supabaseUrl, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const authRes = await adminClient.auth.admin.createUser({
        id: userId,
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name || `${firstName || 'Invited'} ${lastName || 'User'}`,
          role: userRoleType,
          school_id: invitation.schoolId,
        },
      })

      if (authRes.error || !authRes.data?.user?.id) {
        return NextResponse.json(
          { error: `Auth account creation failed: ${authRes.error?.message || 'Unknown auth error'}` },
          { status: 400 }
        )
      }
      userId = authRes.data.user.id as `${string}-${string}-${string}-${string}-${string}`
    }

    return await db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id: userId,
        email,
        name: name || `${firstName || 'Invited'} ${lastName || 'User'}`,
        schoolId: invitation.schoolId,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: userTable.id,
        set: { updatedAt: now }
      })

      await tx.insert(userRole).values({
        id: randomUUID(),
        userId,
        role: userRoleType
      }).onConflictDoNothing()

      if (userRoleType === 'TEACHER') {
        await tx.insert(teacher).values({
          id: randomUUID(),
          userId,
          schoolId: invitation.schoolId,
          firstName: firstName || 'Teacher',
          lastName: lastName || 'Staff',
          gender: gender || 'Male',
          staffCode: `ST-${Math.floor(10000 + Math.random() * 90000)}`,
          status: 'ACTIVE'
        } as any)
      } else if (userRoleType === 'PARENT') {
        await tx.insert(parent).values({
          id: randomUUID(),
          userId,
          schoolId: invitation.schoolId,
          firstName: firstName || 'Parent',
          lastName: lastName || 'Guardian',
          gender: gender || 'Male',
          phoneNumber: invitation.phone || null
        } as any)
      } else if (userRoleType === 'STUDENT') {
        await tx.insert(student).values({
          id: randomUUID(),
          userId,
          schoolId: invitation.schoolId,
          firstName: firstName || 'Student',
          lastName: lastName || 'Pupil',
          gender: gender || 'Male',
          class: 'JSS1',
          admissionNumber: `STU-${Math.floor(10000 + Math.random() * 90000)}`,
          registrationStatus: 'ACTIVE'
        } as any)
      }

      await tx.update(invitations).set({ status: 'ACCEPTED' }).where(eq(invitations.id, invitation.id))

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully! You can now log in.',
        role: userRoleType
      })
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

    const inv = records[0]

    return NextResponse.json({
      success: true,
      invitation: {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invitation details' }, { status: 500 })
  }
}
