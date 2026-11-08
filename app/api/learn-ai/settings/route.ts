import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sqlClient } from '@/lib/db'

const SCHOOL_ADMIN_ROLES = new Set(['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'])

async function getSchoolId(user: { role: string; schoolId: string | null }, requestUrl: string) {
  if (user.role === 'SUPER_ADMIN') {
    return new URL(requestUrl).searchParams.get('school_id') || user.schoolId
  }
  return user.schoolId
}

export async function GET(request: Request) {
  const session = await auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  if (!SCHOOL_ADMIN_ROLES.has(session.user.role)) return NextResponse.json({ error: 'School administrator access required.' }, { status: 403 })

  const schoolId = await getSchoolId(session.user, request.url)
  if (!schoolId) return NextResponse.json({ error: 'Choose a school before editing its Learn AI guidance.' }, { status: 400 })

  try {
    const [settings] = await sqlClient`
      select instructions from public.learn_ai_school_settings
      where school_id = ${schoolId} limit 1
    `
    return NextResponse.json({ instructions: settings?.instructions || '' })
  } catch {
    return NextResponse.json({ error: 'Learn AI settings are temporarily unavailable.' }, { status: 503 })
  }
}

export async function PUT(request: Request) {
  const session = await auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  if (!SCHOOL_ADMIN_ROLES.has(session.user.role)) return NextResponse.json({ error: 'School administrator access required.' }, { status: 403 })

  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: 'Cross-origin settings updates are not allowed.' }, { status: 403 })
  }

  const schoolId = await getSchoolId(session.user, request.url)
  if (!schoolId) return NextResponse.json({ error: 'Choose a school before editing its Learn AI guidance.' }, { status: 400 })

  let instructions: unknown
  try {
    instructions = (await request.json() as { instructions?: unknown }).instructions
  } catch {
    return NextResponse.json({ error: 'Invalid settings request.' }, { status: 400 })
  }
  if (typeof instructions !== 'string' || instructions.length > 4000) {
    return NextResponse.json({ error: 'Guidance must be 4,000 characters or fewer.' }, { status: 400 })
  }

  try {
    await sqlClient`
      insert into public.learn_ai_school_settings (school_id, instructions, updated_by, updated_at)
      values (${schoolId}, ${instructions.trim()}, ${session.user.id}, now())
      on conflict (school_id) do update
      set instructions = excluded.instructions,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
    `
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not save school Learn AI guidance.' }, { status: 503 })
  }
}