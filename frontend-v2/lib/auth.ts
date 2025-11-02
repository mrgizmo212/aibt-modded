/**
 * Authentication Helper Functions
 * Manages JWT tokens and auth headers for API requests
 * Stores tokens in both localStorage (for client-side) and cookies (for middleware)
 */

const TOKEN_KEY = 'jwt_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  
  // Store in localStorage for client-side access
  localStorage.setItem(TOKEN_KEY, token)
  
  // Also store in cookie for middleware access
  // Set expiry to 7 days
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7)
  document.cookie = `${TOKEN_KEY}=${token}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  
  // Remove from localStorage
  localStorage.removeItem(TOKEN_KEY)
  
  // Remove from cookie
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  if (!token) return {}
  
  return {
    'Authorization': `Bearer ${token}`
  }
}

