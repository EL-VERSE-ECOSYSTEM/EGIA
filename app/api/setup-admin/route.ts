import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userRole } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create admin role for user
    await db.insert(userRole).values({
      id: randomUUID(),
      userId: session.user.id,
      role: 'ADMIN',
    }).onConflictDoUpdate({
      target: userRole.userId,
      set: { role: 'ADMIN' },
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
