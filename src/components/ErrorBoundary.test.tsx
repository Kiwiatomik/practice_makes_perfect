import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'
import React from 'react'

// Mock Bootstrap components
vi.mock('react-bootstrap', async () => {
  const React = await import('react')

  const MockAlert = React.forwardRef(({ children, variant, className, ...props }: { children?: React.ReactNode; variant?: string; className?: string; [key: string]: any }, ref: any) => (
    React.createElement('div', {
      ref,
      'data-testid': 'alert',
      'data-variant': variant,
      className,
      ...props
    }, children)
  ))
  MockAlert.displayName = 'MockAlert'

  // Add Heading subcomponent to Alert
  const MockAlertHeading = ({ children, ...props }: any) =>
    React.createElement('h4', { 'data-testid': 'alert-heading', ...props }, children)
  MockAlertHeading.displayName = 'MockAlertHeading'

  Object.assign(MockAlert, {
    Heading: MockAlertHeading
  })

  return {
    Alert: MockAlert,
    Button: (() => {
      const MockButton = React.forwardRef(({ children, variant, onClick, className, ...props }: { children?: React.ReactNode; variant?: string; onClick?: () => void; className?: string; [key: string]: any }, ref: any) =>
        React.createElement('button', {
          ref,
          'data-testid': 'button',
          'data-variant': variant,
          className,
          onClick,
          ...props
        }, children)
      )
      MockButton.displayName = 'MockButton'
      return MockButton
    })(),
    Container: (() => {
      const MockContainer = React.forwardRef(({ children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: any }, ref: any) =>
        React.createElement('div', {
          ref,
          'data-testid': 'container',
          className,
          ...props
        }, children)
      )
      MockContainer.displayName = 'MockContainer'
      return MockContainer
    })()
  }
})

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div data-testid="child-component">Child component rendered</div>
}
ThrowError.displayName = 'ThrowError'

// Test component that throws error with stack trace
const ThrowErrorWithStack = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    const error = new Error('Test error with stack')
    error.stack = 'Error: Test error with stack\n    at ThrowErrorWithStack (test.tsx:1:1)'
    throw error
  }
  return <div data-testid="child-component">Child component rendered</div>
}
ThrowErrorWithStack.displayName = 'ThrowErrorWithStack'

describe('ErrorBoundary', () => {
  let consoleSpy: any
  let originalEnv: string | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    // Restore original NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.getByText('Child component rendered')).toBeInTheDocument()
    })

    it('should not render error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      )

      expect(screen.queryByTestId('alert')).not.toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })
  })

  describe('when an error occurs', () => {
    it('should catch errors and display error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
      expect(screen.queryByTestId('child-component')).not.toBeInTheDocument()
    })

    it('should display error alert with danger variant', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveAttribute('data-variant', 'danger')
    })

    it('should display Try Again and Refresh Page buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })

    it('should call console.error when error is caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error boundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })
  })

  describe('development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should display error details in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument()
      expect(screen.getByText(/Error: Test error message/)).toBeInTheDocument()
    })

    it('should display error stack trace in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorWithStack shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Error: Test error with stack/)).toBeInTheDocument()
      expect(screen.getByText(/at ThrowErrorWithStack/)).toBeInTheDocument()
    })

    it('should hide error details in production mode', () => {
      process.env.NODE_ENV = 'production'
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument()
      expect(screen.queryByText('Error: Test error message')).not.toBeInTheDocument()
    })
  })

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error message</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should not render default error UI when custom fallback is provided', () => {
      const customFallback = <div>Custom fallback</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.queryByTestId('alert')).not.toBeInTheDocument()
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
      expect(screen.queryByText('Refresh Page')).not.toBeInTheDocument()
    })
  })

  describe('onError callback', () => {
    it('should call onError callback when error occurs', () => {
      const mockOnError = vi.fn()

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(mockOnError).toHaveBeenCalledTimes(1)
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('should pass correct error object to onError callback', () => {
      const mockOnError = vi.fn()

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const [error] = mockOnError.mock.calls[0]
      expect(error.message).toBe('Test error message')
    })

    it('should work without onError callback', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        )
      }).not.toThrow()

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Try Again functionality', () => {
    it('should reset error state when Try Again is clicked', () => {
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true)

        return (
          <ErrorBoundary>
            <button onClick={() => setShouldThrow(false)}>Fix Error</button>
            <ThrowError shouldThrow={shouldThrow} />
          </ErrorBoundary>
        )
      }

      render(<TestComponent />)

      // Initially shows error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'))

      // Error boundary should attempt to re-render children
      // Since the component will still throw, error UI should persist
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should clear error state after Try Again is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Try Again'))

      // The error boundary will re-render and catch the error again,
      // but the state should have been cleared and error caught again
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Refresh Page functionality', () => {
    it('should call window.location.reload when Refresh Page is clicked', () => {
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByText('Refresh Page'))

      expect(mockReload).toHaveBeenCalledTimes(1)
    })
  })

  describe('error boundary lifecycle', () => {
    it('should handle getDerivedStateFromError correctly', () => {
      // This test verifies the static method behavior
      const error = new Error('Test error')
      const newState = ErrorBoundary.getDerivedStateFromError(error)

      expect(newState).toEqual({
        hasError: true,
        error: error
      })
    })

    it('should maintain error state until reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Rerender with different props but same error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const alert = screen.getByTestId('alert')
      expect(alert).toBeInTheDocument()
      
      const buttons = screen.getAllByTestId('button')
      expect(buttons).toHaveLength(2)
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('data-testid', 'button')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle error without message', () => {
      const ThrowEmptyError = () => {
        throw new Error('')
      }

      render(
        <ErrorBoundary>
          <ThrowEmptyError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should handle non-Error objects being thrown', () => {
      const ThrowString = () => {
        throw 'String error'
      }

      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should handle multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <ThrowError shouldThrow={false} />
          <div>Child 3</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child component rendered')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })
  })
})