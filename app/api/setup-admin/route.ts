import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userRole } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create admin role for user
    await db.insert(userRole).values({
      userId: session.user.id,
      role: 'admin',
    }).onConflictDoUpdate({
      target: userRole.userId,
      set: { role: 'admin' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin' },
      { status: 500 }
    )
  }
}
