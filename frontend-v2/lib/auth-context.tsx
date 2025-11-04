'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, login as apiLogin, logout as apiLogout } from './api'
import { getToken, setToken, removeToken, isAuthenticated as checkAuth } from './auth'
import type { User } from './types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      if (!checkAuth()) {
        setLoading(false)
        return
      }

      // Token exists, verify it's valid by fetching user
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Auth check failed:', error)
      // Token invalid, clear it
      removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    console.log('[AuthContext] Login called with:', { email, hasPassword: !!password })
    try {
      console.log('[AuthContext] Calling API login...')
      const response = await apiLogin(email, password)
      console.log('[AuthContext] API response received:', { hasToken: !!response.access_token, user: response.user })
      
      // Store token (backend returns "access_token")
      if (response.access_token) {
        setToken(response.access_token)
        console.log('[AuthContext] Token stored')
      }
      
      // Set user
      setUser(response.user)
      console.log('[AuthContext] User set, redirecting to /new')
      
      // Redirect to fresh conversation (chat-first UX)
      router.push('/new')
    } catch (error) {
      console.error('[AuthContext] Login failed:', error)
      throw error
    }
  }

  async function logout() {
    try {
      await apiLogout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear local state regardless of API success
      removeToken()
      setUser(null)
      router.push('/login')
    }
  }

  async function refreshUser() {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      removeToken()
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user && checkAuth(),
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

