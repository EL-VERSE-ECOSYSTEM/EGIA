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
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
