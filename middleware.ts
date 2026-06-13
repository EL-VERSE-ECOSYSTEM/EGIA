import { type NextRequest, NextResponse } from 'next/server'

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

  // Check if user has auth cookie
  const hasCookie = request.cookies.has('better-auth.session_token') || 
                    request.cookies.has('better-auth.account_id')

  if (!hasCookie) {
    // Redirect unauthenticated users to sign-in
    // Standardizing on /sign-in as per middleware publicRoutes
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
