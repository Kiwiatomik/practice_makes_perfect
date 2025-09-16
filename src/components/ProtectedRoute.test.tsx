import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProtectedRoute from './ProtectedRoute'
// import React from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>
}))

// Mock AuthContext
const mockUseAuth = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock react-bootstrap/Container
vi.mock('react-bootstrap/Container', () => {
  const React = require('react')
  return {
    default: React.forwardRef<HTMLDivElement, { children?: React.ReactNode; className?: string; [key: string]: any }>(({ children, className, ...props }, ref) => (
      React.createElement('div', {
        ref,
        'data-testid': 'container',
        className,
        ...props
      }, children)
    ))
  }
})

// Mock react-bootstrap/Alert
vi.mock('react-bootstrap/Alert', () => {
  const React = require('react')
  
  const MockAlert = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; variant?: string; className?: string; [key: string]: any }>(({ children, variant, className, ...props }, ref) => (
    React.createElement('div', {
      ref,
      'data-testid': 'alert',
      'data-variant': variant,
      className,
      ...props
    }, children)
  ))

  Object.assign(MockAlert, {
    Heading: ({ children, ...props }: any) => 
      React.createElement('h4', { 'data-testid': 'alert-heading', ...props }, children)
  })

  return { default: MockAlert }
})

// Mock react-bootstrap/Button
vi.mock('react-bootstrap/Button', () => {
  const React = require('react')
  return {
    default: React.forwardRef<HTMLButtonElement, { children?: React.ReactNode; variant?: string; onClick?: () => void; className?: string; [key: string]: any }>(({ children, variant, onClick, className, ...props }, ref) => 
      React.createElement('button', {
        ref,
        'data-testid': 'button',
        'data-variant': variant,
        className,
        onClick,
        ...props
      }, children)
    )
  }
})

// Mock window.location.href
const mockLocationHref = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: mockLocationHref
  },
  writable: true
})

// Test child component
const TestChild = () => <div data-testid="protected-content">Protected Content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    // Reset location.href setter
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        assign: mockLocationHref
      },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: {
          uid: 'user123',
          email: 'test@example.com',
          displayName: 'Test User'
        }
      })
    })

    it('should render children when user is logged in', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should not show authentication warning when user is logged in', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('alert')).not.toBeInTheDocument()
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
    })

    it('should render multiple children when authenticated', () => {
      render(
        <ProtectedRoute>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should render complex child components when authenticated', () => {
      const ComplexChild = () => (
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to your dashboard</p>
          <button>Action Button</button>
        </div>
      )

      render(
        <ProtectedRoute>
          <ComplexChild />
        </ProtectedRoute>
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Welcome to your dashboard')).toBeInTheDocument()
      expect(screen.getByText('Action Button')).toBeInTheDocument()
    })
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        currentUser: null
      })
    })

    it('should show authentication warning when user is not logged in', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.getByText('You need to be logged in to access this page.')).toBeInTheDocument()
    })

    it('should not render protected children when user is not logged in', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should display warning alert with correct variant', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveAttribute('data-variant', 'warning')
    })

    it('should display Go to Home button', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      const button = screen.getByText('Go to Home')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-testid', 'button')
      expect(button).toHaveAttribute('data-variant', 'primary')
    })

    it('should redirect to default path when Go to Home is clicked', () => {
      const mockHrefSetter = vi.fn()
      Object.defineProperty(window, 'location', {
        value: {
          get href() { return '' },
          set href(value) {
            mockHrefSetter(value)
          }
        },
        configurable: true
      })

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      const button = screen.getByText('Go to Home')
      fireEvent.click(button)

      expect(mockHrefSetter).toHaveBeenCalledWith('/')
    })

    it('should redirect to custom path when redirectTo is provided', () => {
      const mockHrefSetter = vi.fn()
      Object.defineProperty(window, 'location', {
        value: {
          get href() { return '' },
          set href(value) {
            mockHrefSetter(value)
          }
        },
        configurable: true
      })

      render(
        <ProtectedRoute redirectTo="/login">
          <TestChild />
        </ProtectedRoute>
      )

      const button = screen.getByText('Go to Home')
      fireEvent.click(button)

      expect(mockHrefSetter).toHaveBeenCalledWith('/login')
    })

    it('should use Container with proper styling', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      const container = screen.getByTestId('container')
      expect(container).toHaveClass('mt-5')
    })

    it('should have alert with proper styling', () => {
      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('text-center')
    })
  })

  describe('authentication state changes', () => {
    it('should update when authentication state changes from null to user', () => {
      // Start with no user
      mockUseAuth.mockReturnValue({ currentUser: null })
      
      const { rerender } = render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()

      // User logs in
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'test@example.com' }
      })

      rerender(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should update when authentication state changes from user to null', () => {
      // Start with authenticated user
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'test@example.com' }
      })
      
      const { rerender } = render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()

      // User logs out
      mockUseAuth.mockReturnValue({ currentUser: null })

      rerender(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined currentUser', () => {
      mockUseAuth.mockReturnValue({
        currentUser: undefined
      })

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle empty children', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' }
      })

      render(<ProtectedRoute>{null}</ProtectedRoute>)

      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
    })

    it('should handle multiple nested children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' }
      })

      render(
        <ProtectedRoute>
          <div>
            <div>
              <TestChild />
            </div>
          </div>
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should handle custom redirectTo paths', () => {
      mockUseAuth.mockReturnValue({ currentUser: null })

      const customPaths = ['/login', '/signin', '/auth', '/welcome']

      customPaths.forEach((path, index) => {
        const mockHrefSetter = vi.fn()
        Object.defineProperty(window, 'location', {
          value: {
            get href() { return '' },
            set href(value) {
              mockHrefSetter(value)
            }
          },
          configurable: true
        })

        const { unmount } = render(
          <ProtectedRoute redirectTo={path}>
            <TestChild />
          </ProtectedRoute>
        )

        const button = screen.getByText('Go to Home')
        fireEvent.click(button)

        expect(mockHrefSetter).toHaveBeenCalledWith(path)
        
        // Clean up for next iteration
        unmount()
        document.body.innerHTML = ''
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure for screen readers', () => {
      mockUseAuth.mockReturnValue({ currentUser: null })

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('alert-heading')).toBeInTheDocument()
      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
    })

    it('should have accessible button for navigation', () => {
      mockUseAuth.mockReturnValue({ currentUser: null })

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      const button = screen.getByRole('button', { name: 'Go to Home' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('integration with useAuth hook', () => {
    it('should call useAuth hook', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' }
      })

      render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(mockUseAuth).toHaveBeenCalledTimes(1)
    })

    it('should handle different user object structures', () => {
      // Test with minimal user object
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' }
      })

      const { rerender } = render(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()

      // Test with full user object
      mockUseAuth.mockReturnValue({
        currentUser: {
          uid: 'user123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          emailVerified: true
        }
      })

      rerender(
        <ProtectedRoute>
          <TestChild />
        </ProtectedRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })
})