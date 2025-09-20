import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { setUser, captureException } from '../config/sentry'
import analyticsService from '../services/analyticsService'
import loggingService from '../services/loggingService'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = async () => {
    try {
      loggingService.authEvent('logout_initiated')
      await signOut(auth)
      analyticsService.trackLogout()
      loggingService.authEvent('logout_successful')
    } catch (error) {
      console.error('Error signing out:', error)
      loggingService.error('logout failed', error as Error, { errorType: 'auth_error' })
      captureException(error as Error, { context: 'logout' })
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('AuthContext - Auth state changed:', user?.email || 'null')
      setCurrentUser(user)
      setLoading(false)

      // Set Sentry user context and analytics
      if (user) {
        setUser({
          id: user.uid,
          email: user.email || undefined,
        })

        // Set analytics user properties
        analyticsService.setUserProperties({
          user_id: user.uid,
          email: user.email || undefined,
          sign_in_method: user.providerData[0]?.providerId || 'unknown'
        })

        // Update logging context
        loggingService.setGlobalContext({
          userId: user.uid,
          userEmail: user.email || undefined
        })

        loggingService.authEvent('user_authenticated', {
          userId: user.uid,
          method: user.providerData[0]?.providerId || 'unknown'
        })
      } else {
        setUser({ id: 'anonymous' })
        loggingService.setGlobalContext({})
        loggingService.authEvent('user_logged_out')
      }
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    currentUser,
    loading,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}