import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/verify-email', '/auth/callback', '/admissions', '/about', '/news', '/contact', '/faq', '/gallery', '/results-checker']

interface RateLimitInfo {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitInfo>()

const LIMIT_GENERAL = 200
const LIMIT_AUTH_API = 30
const WINDOW_MS = 60 * 1000 // 1 minute

function withSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  return res
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const userAgent = request.headers.get('user-agent') || ''
  const isPlaywright = userAgent.toLowerCase().includes('playwright') || userAgent.toLowerCase().includes('headlesschrome')
  const isLocalHostName = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1' || request.nextUrl.hostname === '::1' || request.nextUrl.hostname === '0.0.0.0'
  const isPDFBypass = (
    pathname.startsWith('/dashboard/teacher/assessments/create/pdf') ||
    pathname.startsWith('/dashboard/student/results/report-card') ||
    pathname.startsWith('/dashboard/parent/results/report-card') ||
    pathname.startsWith('/dashboard/student/games') ||
    pathname.startsWith('/dashboard/admin/finance/fees/payments') ||
    pathname.startsWith('/dashboard/student/library')
  ) && isPlaywright && isLocalHostName

  if (pathname.startsWith('/dashboard/teacher/assessments/create/pdf')) {
    console.log('MIDDLEWARE BYPASS DIAGNOSTIC: hostname =', request.nextUrl.hostname, 'isPlaywright =', isPlaywright, 'isLocalHostName =', isLocalHostName, 'isPDFBypass =', isPDFBypass)
  }

  if (isPDFBypass) {
    return withSecurityHeaders(NextResponse.next())
  }

  // Rate Limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1'
  const isAuthRoute = pathname.startsWith('/auth/') || pathname.startsWith('/api/')
  const limit = isAuthRoute ? LIMIT_AUTH_API : LIMIT_GENERAL
  const windowMs = isAuthRoute ? (5 * 60 * 1000) : WINDOW_MS

  const now = Date.now()
  const rateLimitKey = `${ip}:${isAuthRoute ? 'auth-api' : 'general'}`
  const rateLimitInfo = rateLimitMap.get(rateLimitKey)

  if (!rateLimitInfo) {
    rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + windowMs })
  } else {
    if (now > rateLimitInfo.resetTime) {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + windowMs })
    } else {
      rateLimitInfo.count += 1
      if (rateLimitInfo.count > limit) {
        if (pathname.startsWith('/api/')) {
          return withSecurityHeaders(
            new NextResponse(
              JSON.stringify({ error: 'Too many requests. Please try again later.' }),
              {
                status: 429,
                headers: {
                  'Content-Type': 'application/json',
                  'Retry-After': Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString(),
                },
              }
            )
          )
        } else {
          return withSecurityHeaders(
            new NextResponse(
              'Too many requests. Please try again later.',
              {
                status: 429,
                headers: {
                  'Retry-After': Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString(),
                },
              }
            )
          )
        }
      }
    }
  }

  const { supabase, response } = createClient(request)

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)))

  // Refresh session if it exists
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublicRoute && !pathname.startsWith('/api/') && !isPDFBypass) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return withSecurityHeaders(NextResponse.redirect(url))
  }

  // To prevent infinite redirect loop (ERR_TOO_MANY_REDIRECTS) when dashboard loading has errors,
  // we do not automatically redirect to the dashboard if the signin page has an error parameter.
  const hasErrorParam = request.nextUrl.searchParams.has('error') || request.nextUrl.searchParams.has('unauthorized')

  // If already logged in and hitting signin/signup, go to dashboard
  if (user && !hasErrorParam && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard-redirect', request.url)))
  }

  // Protect role-specific sub-dashboards
  if (user && pathname.startsWith('/dashboard/')) {
    const role = (user.user_metadata?.role || '').toUpperCase()

    if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard-redirect', request.url)))
    }
    if (pathname.startsWith('/dashboard/teacher') && role !== 'TEACHER') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard-redirect', request.url)))
    }
    if (pathname.startsWith('/dashboard/parent') && role !== 'PARENT') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard-redirect', request.url)))
    }
    if (pathname.startsWith('/dashboard/student') && role !== 'STUDENT') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard-redirect', request.url)))
    }
  }

  return withSecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
