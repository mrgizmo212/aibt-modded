'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface RouteGuardProps {
  children: React.ReactNode
}

const publicRoutes = ['/login', '/signup']

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) return

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // If accessing protected route without authentication, redirect to login
    if (!isPublicRoute && !isAuthenticated) {
      console.log('[RouteGuard] Unauthenticated user on protected route, redirecting to login')
      router.push('/login')
      return
    }

    // If accessing login/signup with valid authentication, redirect to dashboard
    if (isPublicRoute && isAuthenticated) {
      console.log('[RouteGuard] Authenticated user on public route, redirecting to dashboard')
      router.push('/')
      return
    }
  }, [isAuthenticated, loading, pathname, router])

  // Show loading or children
  // While loading, show nothing to prevent flash of wrong page
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
