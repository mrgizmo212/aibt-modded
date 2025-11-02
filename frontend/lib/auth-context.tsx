'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser } from './api'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    // Check for existing token and validate it
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setLoading(false)
        
        // Redirect to login if not on public route
        if (!isPublicRoute) {
          router.push('/login')
        }
        return
      }

      try {
        const userData = await getCurrentUser()
        setUser(userData)
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('token')
        setUser(null)
        setLoading(false)
        
        // Redirect to login if not on public route
        if (!isPublicRoute) {
          router.push('/login')
        }
      }
    }

    checkAuth()
  }, [pathname, router, isPublicRoute])

  const login = (token: string) => {
    localStorage.setItem('token', token)
    
    // Fetch user data
    getCurrentUser()
      .then((userData) => {
        setUser(userData)
        router.push('/dashboard')
      })
      .catch((error) => {
        console.error('Failed to fetch user data:', error)
        localStorage.removeItem('token')
      })
  }

  const logout = async () => {
    try {
      // Call backend logout endpoint
      const { logout: logoutApi } = await import('./api')
      await logoutApi()
    } catch (error) {
      console.error('Logout API call failed:', error)
      // Continue with local logout anyway
    }
    
    // Clear local state
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

