import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

const publicRoutes = ['/sign-in', '/sign-up', '/', '/api/auth', '/setup-role']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Use Supabase middleware for session management
  return createClient(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
