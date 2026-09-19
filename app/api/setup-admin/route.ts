import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userRole } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Setup Admin Secret header
    const setupSecret = request.headers.get('x-setup-admin-secret')
    const envSecret = process.env.SETUP_ADMIN_SECRET

    if (!envSecret || setupSecret !== envSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid setup admin secret token.' },
        { status: 401 }
      )
    }

    // 2. Verify authenticated session
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Valid user session required.' }, { status: 401 })
    }

    // 3. Ensure requesting user has SUPER_ADMIN role before assigning ADMIN
    const callingUserRoles = await db
      .select()
      .from(userRole)
      .where(and(eq(userRole.userId, session.user.id), eq(userRole.role, 'SUPER_ADMIN')))

    if (callingUserRoles.length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: Only existing SUPER_ADMIN accounts can perform admin setup.' },
        { status: 403 }
      )
    }

    // Assign ADMIN role
    await db.insert(userRole).values({
      id: randomUUID(),
      userId: session.user.id,
      role: 'ADMIN',
    }).onConflictDoUpdate({
      target: userRole.userId,
      set: { role: 'ADMIN' },
    })

    return NextResponse.json({ success: true, message: 'Admin role granted successfully.' })
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin' },
      { status: 500 }
    )
  }
}
