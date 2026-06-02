import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { authClient } from '@/services/auth-client'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  setAuthenticated: (value: boolean) => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await authClient.getSession()
      setIsAuthenticated(!error && !!data?.session)
    }
    catch {
      setIsAuthenticated(false)
    }
  }, [])

  const setAuthenticated = useCallback((value: boolean) => {
    setIsAuthenticated(value)
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        await refreshSession()
      }
      catch {
        setIsAuthenticated(false)
      }
      finally {
        setIsLoading(false)
      }
    }
    check()
  }, [refreshSession])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshSession()
      }
    })
    return () => sub.remove()
  }, [refreshSession])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, setAuthenticated, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
