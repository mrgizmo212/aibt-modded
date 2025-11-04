import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Get auth token from cookie or localStorage (check cookie for SSR)
  const token = request.cookies.get('jwt_token')?.value
  
  // If accessing protected route without token, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // If accessing login/signup with valid token, redirect to dashboard
  if (isPublicRoute && token) {
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  return NextResponse.next()
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

