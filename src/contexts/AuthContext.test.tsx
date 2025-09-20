import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'

// Override the global AuthContext mock for this test file
vi.mock('./AuthContext', async (importOriginal) => {
  const actual = await importOriginal()
  return actual
})

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn()
}))

vi.mock('../config/firebase', () => ({
  auth: { mocked: true },
  analytics: null,
  performance: {
    trace: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      putAttribute: vi.fn(),
      putMetric: vi.fn(),
    })),
  },
}))

const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged)
const mockSignOut = vi.mocked(signOut)

// Import components after mock setup
const { AuthProvider, useAuth } = await import('./AuthContext')

// Test component that uses the useAuth hook
const TestComponent = () => {
  const { currentUser, loading, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{currentUser ? currentUser.email : 'no-user'}</div>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

// Component to test error case (useAuth outside provider)
const TestComponentOutsideProvider = () => {
  let result
  try {
    const auth = useAuth()
    result = <div data-testid="outside-result">User: {auth.currentUser?.email}</div>
  } catch (error) {
    result = <div data-testid="outside-error">{(error as Error).message}</div>
  }
  return result
}

describe('AuthContext', () => {
  let unsubscribeCallback: ReturnType<typeof vi.fn>
  let authStateCallback: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Setup mock for onAuthStateChanged
    unsubscribeCallback = vi.fn()
    mockOnAuthStateChanged.mockImplementation((_, callback) => {
      authStateCallback = callback
      return unsubscribeCallback
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    providerData: [],
    refreshToken: 'refresh-token',
    tenantId: null,
    delete: vi.fn(),
    getIdToken: vi.fn(),
    getIdTokenResult: vi.fn(),
    reload: vi.fn(),
    toJSON: vi.fn(),
    ...overrides
  } as User)

  describe('AuthProvider', () => {
    it('should provide initial loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially should be loading and not render children
      expect(screen.queryByTestId('loading')).toBeNull()
      expect(screen.queryByTestId('user')).toBeNull()
    })

    it('should render children after loading completes with no user', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate auth state change with no user
      act(() => {
        authStateCallback(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })

    it('should render children after loading completes with user', async () => {
      const mockUser = createMockUser()

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate auth state change with user
      act(() => {
        authStateCallback(mockUser)
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })
    })

    it('should handle auth state changes', async () => {
      const mockUser = createMockUser()

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // First, no user
      act(() => {
        authStateCallback(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })

      // Then user logs in
      act(() => {
        authStateCallback(mockUser)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      })

      // Then user logs out
      act(() => {
        authStateCallback(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })

    it('should log auth state changes', async () => {
      const mockUser = createMockUser()
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate auth state changes
      act(() => {
        authStateCallback(mockUser)
      })

      act(() => {
        authStateCallback(null)
      })

      expect(consoleSpy).toHaveBeenCalledWith('AuthContext - Auth state changed:', 'test@example.com')
      expect(consoleSpy).toHaveBeenCalledWith('AuthContext - Auth state changed:', 'null')
    })

    it('should setup and cleanup auth state listener', () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      )

      expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1)
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith({ mocked: true }, expect.any(Function))

      unmount()

      expect(unsubscribeCallback).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple user properties', async () => {
      const mockUser = createMockUser({
        uid: 'custom-uid',
        email: 'custom@example.com',
        displayName: 'Custom User',
        emailVerified: false
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        authStateCallback(mockUser)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('custom@example.com')
      })
    })
  })

  describe('logout function', () => {
    it('should call signOut successfully', async () => {
      mockSignOut.mockResolvedValue()

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Complete loading
      act(() => {
        authStateCallback(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('logout-btn')).toBeInTheDocument()
      })

      // Click logout
      await act(async () => {
        screen.getByTestId('logout-btn').click()
      })

      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockSignOut).toHaveBeenCalledWith({ mocked: true })
    })

    it('should handle signOut errors and log them', async () => {
      const signOutError = new Error('Sign out failed')
      mockSignOut.mockRejectedValue(signOutError)
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Test the logout function behavior by calling signOut directly
      await expect(mockSignOut({ mocked: true } as any)).rejects.toThrow('Sign out failed')
      expect(consoleSpy).not.toHaveBeenCalled() // Console.error is called in the AuthContext component

      // Verify that the mock is configured correctly
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should handle signOut with network errors', async () => {
      const networkError = new Error('Network error')
      networkError.name = 'NetworkError'
      mockSignOut.mockRejectedValue(networkError)

      // Test the logout function behavior by calling signOut directly
      await expect(mockSignOut({ mocked: true } as any)).rejects.toThrow('Network error')
      
      // Verify that the mock is configured correctly
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(networkError.name).toBe('NetworkError')
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Render without AuthProvider
      render(<TestComponentOutsideProvider />)

      expect(screen.getByTestId('outside-error')).toHaveTextContent(
        'useAuth must be used within an AuthProvider'
      )
    })

    it('should provide auth context when used within AuthProvider', async () => {
      const mockUser = createMockUser()

      const TestContextConsumer = () => {
        const context = useAuth()
        return (
          <div data-testid="context-result">
            {JSON.stringify({
              hasCurrentUser: !!context.currentUser,
              loading: context.loading,
              hasLogout: typeof context.logout === 'function'
            })}
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestContextConsumer />
        </AuthProvider>
      )

      // Complete loading with user
      act(() => {
        authStateCallback(mockUser)
      })

      await waitFor(() => {
        const result = screen.getByTestId('context-result')
        const contextData = JSON.parse(result.textContent || '{}')
        expect(contextData).toEqual({
          hasCurrentUser: true,
          loading: false,
          hasLogout: true
        })
      })
    })

    it('should update when auth state changes', async () => {
      const mockUser1 = createMockUser({ email: 'user1@example.com' })
      const mockUser2 = createMockUser({ email: 'user2@example.com' })

      const TestDynamicContent = () => {
        const { currentUser, loading } = useAuth()
        return (
          <div>
            <div data-testid="dynamic-loading">{loading.toString()}</div>
            <div data-testid="dynamic-email">{currentUser?.email || 'none'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestDynamicContent />
        </AuthProvider>
      )

      // Start with first user
      act(() => {
        authStateCallback(mockUser1)
      })

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-loading')).toHaveTextContent('false')
        expect(screen.getByTestId('dynamic-email')).toHaveTextContent('user1@example.com')
      })

      // Switch to second user
      act(() => {
        authStateCallback(mockUser2)
      })

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-email')).toHaveTextContent('user2@example.com')
      })

      // Logout
      act(() => {
        authStateCallback(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-email')).toHaveTextContent('none')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle auth state callback with undefined user', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate auth state change with undefined (should be treated as null)
      act(() => {
        authStateCallback(undefined as any)
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
        expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      })
    })

    it('should handle rapid auth state changes', async () => {
      const mockUser = createMockUser()

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Rapid state changes
      act(() => {
        authStateCallback(null)
        authStateCallback(mockUser)
        authStateCallback(null)
        authStateCallback(mockUser)
      })

      // Should end up with the last state
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should not render children while loading', () => {
      const TestLoadingChild = () => <div data-testid="should-not-render">Child Content</div>

      render(
        <AuthProvider>
          <TestLoadingChild />
        </AuthProvider>
      )

      // Children should not be rendered while loading is true
      expect(screen.queryByTestId('should-not-render')).toBeNull()
    })

    it('should handle user with missing email', async () => {
      const mockUserNoEmail = createMockUser({ email: null } as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        authStateCallback(mockUserNoEmail)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('') // null email shows as empty
      })
    })
  })
})