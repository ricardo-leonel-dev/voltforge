import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { LoginRequest, RegisterRequest, User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (req: LoginRequest) => Promise<void>
  register: (req: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) {
      setIsLoading(false)
      return
    }
    api.auth.me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('auth_token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (req: LoginRequest) => {
    const res = await api.auth.login(req)
    localStorage.setItem('auth_token', res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (req: RegisterRequest) => {
    const res = await api.auth.register(req)
    localStorage.setItem('auth_token', res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isSuperAdmin: user?.role === 'superadmin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
