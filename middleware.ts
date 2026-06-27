import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/verify-email', '/auth/callback', '/admissions', '/about']

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const pathname = request.nextUrl.pathname

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

  // Refresh session if it exists
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublicRoute && !pathname.startsWith('/api/')) {
    console.log('Middleware: Redirecting to signin', pathname)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // If already logged in and hitting signin, go to dashboard
  if (user && pathname === '/auth/signin') {
    return NextResponse.redirect(new URL('/dashboard-redirect', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
