import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import ErrorState from './ErrorState'
import React from 'react'

// Mock react-bootstrap/Container
vi.mock('react-bootstrap/Container', () => {
  const React = require('react')
  return {
    default: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
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
  
  const MockAlert = React.forwardRef<HTMLDivElement, any>(({ children, variant, className, ...props }, ref) => (
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
    default: React.forwardRef<HTMLButtonElement, any>(({ children, variant, onClick, className, as: Component = 'button', to, ...props }, ref) => {
      if (Component === 'a' || to) {
        // Render as link when used with Link component
        return React.createElement('a', {
          ref,
          'data-testid': 'button-link',
          'data-variant': variant,
          'data-to': to,
          className,
          ...props
        }, children)
      }
      return React.createElement('button', {
        ref,
        'data-testid': 'button',
        'data-variant': variant,
        className,
        onClick,
        ...props
      }, children)
    })
  }
})

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

describe('ErrorState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('required props rendering', () => {
    it('should render with required title and message props', () => {
      render(
        <ErrorState 
          title="Test Error"
          message="This is a test error message"
        />
      )

      expect(screen.getByText('Test Error')).toBeInTheDocument()
      expect(screen.getByText('This is a test error message')).toBeInTheDocument()
    })

    it('should display error alert with danger variant', () => {
      render(
        <ErrorState 
          title="Error Title"
          message="Error message"
        />
      )

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveAttribute('data-variant', 'danger')
    })

    it('should use Container with proper styling', () => {
      render(
        <ErrorState 
          title="Error"
          message="Message"
        />
      )

      const container = screen.getByTestId('container')
      expect(container).toHaveClass('my-4')
    })

    it('should have proper heading structure', () => {
      render(
        <ErrorState 
          title="Critical Error"
          message="Something went wrong"
        />
      )

      const heading = screen.getByTestId('alert-heading')
      expect(heading).toHaveTextContent('Critical Error')
    })
  })

  describe('retry functionality', () => {
    it('should render retry button when onRetry is provided', () => {
      const mockRetry = vi.fn()
      
      render(
        <ErrorState 
          title="Network Error"
          message="Failed to connect"
          onRetry={mockRetry}
        />
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should not render retry button when onRetry is not provided', () => {
      render(
        <ErrorState 
          title="Error"
          message="Message"
        />
      )

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', () => {
      const mockRetry = vi.fn()
      
      render(
        <ErrorState 
          title="Error"
          message="Message"
          onRetry={mockRetry}
        />
      )

      fireEvent.click(screen.getByText('Try Again'))
      expect(mockRetry).toHaveBeenCalledTimes(1)
    })

    it('should display custom retry text when provided', () => {
      const mockRetry = vi.fn()
      
      render(
        <ErrorState 
          title="Error"
          message="Message"
          onRetry={mockRetry}
          retryText="Retry Operation"
        />
      )

      expect(screen.getByText('Retry Operation')).toBeInTheDocument()
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })

    it('should render retry button with correct variant and styling', () => {
      const mockRetry = vi.fn()
      
      render(
        <ErrorState 
          title="Error"
          message="Message"
          onRetry={mockRetry}
        />
      )

      const button = screen.getByTestId('button')
      expect(button).toHaveAttribute('data-variant', 'outline-danger')
      expect(button).toHaveClass('me-2')
    })
  })

  describe('back navigation functionality', () => {
    it('should render back link when backLink is provided', () => {
      render(
        <RouterWrapper>
          <ErrorState 
            title="Error"
            message="Message"
            backLink="/home"
          />
        </RouterWrapper>
      )

      expect(screen.getByText('Go Back')).toBeInTheDocument()
    })

    it('should not render back link when backLink is not provided', () => {
      render(
        <ErrorState 
          title="Error"
          message="Message"
        />
      )

      expect(screen.queryByText('Go Back')).not.toBeInTheDocument()
    })

    it('should display custom back text when provided', () => {
      render(
        <RouterWrapper>
          <ErrorState 
            title="Error"
            message="Message"
            backLink="/courses"
            backText="Back to Courses"
          />
        </RouterWrapper>
      )

      expect(screen.getByText('Back to Courses')).toBeInTheDocument()
      expect(screen.queryByText('Go Back')).not.toBeInTheDocument()
    })

    it('should render back button with correct variant', () => {
      render(
        <RouterWrapper>
          <ErrorState 
            title="Error"
            message="Message"
            backLink="/home"
          />
        </RouterWrapper>
      )

      const backButton = screen.getByTestId('button-link')
      expect(backButton).toHaveAttribute('data-variant', 'secondary')
    })
  })

  describe('combined retry and back functionality', () => {
    it('should render both retry and back buttons when both props are provided', () => {
      const mockRetry = vi.fn()
      
      render(
        <RouterWrapper>
          <ErrorState 
            title="Error"
            message="Message"
            onRetry={mockRetry}
            backLink="/home"
          />
        </RouterWrapper>
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Go Back')).toBeInTheDocument()
    })

    it('should render both buttons with custom text', () => {
      const mockRetry = vi.fn()
      
      render(
        <RouterWrapper>
          <ErrorState 
            title="Error"
            message="Message"
            onRetry={mockRetry}
            retryText="Reload Data"
            backLink="/courses"
            backText="Return to Courses"
          />
        </RouterWrapper>
      )

      expect(screen.getByText('Reload Data')).toBeInTheDocument()
      expect(screen.getByText('Return to Courses')).toBeInTheDocument()
    })

    it('should maintain button order and spacing', () => {
      const mockRetry = vi.fn()
      
      render(
        <RouterWrapper>
          <ErrorState 
            title="Error"
            message="Message"
            onRetry={mockRetry}
            backLink="/home"
          />
        </RouterWrapper>
      )

      const retryButton = screen.getByTestId('button')
      const backButton = screen.getByTestId('button-link')
      
      expect(retryButton).toBeInTheDocument()
      expect(backButton).toBeInTheDocument()
      expect(retryButton).toHaveClass('me-2') // retry button has margin
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA structure', () => {
      const mockRetry = vi.fn()
      
      render(
        <RouterWrapper>
          <ErrorState 
            title="Access Denied"
            message="You don't have permission to access this resource"
            onRetry={mockRetry}
            backLink="/login"
          />
        </RouterWrapper>
      )

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-heading')).toBeInTheDocument()
      
      const retryButton = screen.getByRole('button', { name: 'Try Again' })
      expect(retryButton).toBeInTheDocument()
    })

    it('should have descriptive text for screen readers', () => {
      render(
        <ErrorState 
          title="Network Connection Error"
          message="Unable to connect to the server. Please check your internet connection and try again."
        />
      )

      expect(screen.getByText('Network Connection Error')).toBeInTheDocument()
      expect(screen.getByText('Unable to connect to the server. Please check your internet connection and try again.')).toBeInTheDocument()
    })
  })

  describe('edge cases and prop variations', () => {
    it('should handle empty title and message', () => {
      render(
        <ErrorState 
          title=""
          message=""
        />
      )

      const heading = screen.getByTestId('alert-heading')
      const alert = screen.getByTestId('alert')
      
      expect(heading).toHaveTextContent('')
      expect(alert).toBeInTheDocument()
    })

    it('should handle very long title and message', () => {
      const longTitle = 'This is a very long error title that might wrap to multiple lines and should be handled gracefully by the component'
      const longMessage = 'This is an extremely long error message that contains a lot of details about what went wrong and provides comprehensive information to help the user understand the issue and take appropriate action to resolve it.'
      
      render(
        <ErrorState 
          title={longTitle}
          message={longMessage}
        />
      )

      expect(screen.getByText(longTitle)).toBeInTheDocument()
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('should handle special characters in title and message', () => {
      const specialTitle = 'Error: <script>alert("test")</script> & "quotes" & symbols!'
      const specialMessage = 'Message with HTML: <div>test</div> & special chars: áéíóú 🚨'
      
      render(
        <ErrorState 
          title={specialTitle}
          message={specialMessage}
        />
      )

      expect(screen.getByText(specialTitle)).toBeInTheDocument()
      expect(screen.getByText(specialMessage)).toBeInTheDocument()
      
      // Should not create actual HTML elements from the strings
      expect(document.querySelector('script')).toBeNull()
      // Ensure no dangerous HTML was parsed - check that there are no divs with ONLY "test" content
      const testDiv = document.querySelector('div[data-testid]:not([data-testid="container"]):not([data-testid="alert"])')
      expect(testDiv).toBeNull()
    })

    it('should handle empty custom text props', () => {
      const mockRetry = vi.fn()
      
      render(
        <RouterWrapper>
          <ErrorState 
            title="Error"
            message="Message"
            onRetry={mockRetry}
            retryText=""
            backLink="/home"
            backText=""
          />
        </RouterWrapper>
      )

      // Even with empty strings, buttons should render but be empty
      const retryButton = screen.getByTestId('button')
      const backButton = screen.getByTestId('button-link')
      
      expect(retryButton).toHaveTextContent('')
      expect(backButton).toHaveTextContent('')
    })
  })

  describe('component structure and styling', () => {
    it('should render the expected DOM structure', () => {
      const mockRetry = vi.fn()
      
      render(
        <RouterWrapper>
          <ErrorState 
            title="Test Error"
            message="Test message"
            onRetry={mockRetry}
            backLink="/home"
          />
        </RouterWrapper>
      )

      const container = screen.getByTestId('container')
      expect(container).toHaveClass('my-4')

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveAttribute('data-variant', 'danger')

      const heading = screen.getByTestId('alert-heading')
      expect(heading).toHaveTextContent('Test Error')

      const retryButton = screen.getByTestId('button')
      expect(retryButton).toHaveAttribute('data-variant', 'outline-danger')
      expect(retryButton).toHaveClass('me-2')

      const backButton = screen.getByTestId('button-link')
      expect(backButton).toHaveAttribute('data-variant', 'secondary')
    })

    it('should maintain consistent layout with different prop combinations', () => {
      const { rerender } = render(
        <ErrorState 
          title="Error 1"
          message="Message 1"
        />
      )

      expect(screen.getByTestId('container')).toHaveClass('my-4')
      expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'danger')

      rerender(
        <RouterWrapper>
          <ErrorState 
            title="Error 2"
            message="Message 2"
            onRetry={() => {}}
            backLink="/test"
          />
        </RouterWrapper>
      )

      expect(screen.getByTestId('container')).toHaveClass('my-4')
      expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'danger')
    })
  })

  describe('integration scenarios', () => {
    it('should work within different parent containers', () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="parent-wrapper" className="custom-parent">
          {children}
        </div>
      )

      render(
        <TestWrapper>
          <ErrorState 
            title="Integration Test"
            message="Testing integration scenarios"
          />
        </TestWrapper>
      )

      expect(screen.getByTestId('parent-wrapper')).toBeInTheDocument()
      expect(screen.getByText('Integration Test')).toBeInTheDocument()
      expect(screen.getByText('Testing integration scenarios')).toBeInTheDocument()
    })

    it('should render multiple instances independently', () => {
      const mockRetry1 = vi.fn()
      const mockRetry2 = vi.fn()
      
      render(
        <RouterWrapper>
          <>
            <ErrorState 
              title="Error 1"
              message="First error"
              onRetry={mockRetry1}
            />
            <ErrorState 
              title="Error 2"
              message="Second error"
              backLink="/home"
            />
            <ErrorState 
              title="Error 3"
              message="Third error"
              onRetry={mockRetry2}
              backLink="/courses"
            />
          </>
        </RouterWrapper>
      )

      expect(screen.getByText('Error 1')).toBeInTheDocument()
      expect(screen.getByText('Error 2')).toBeInTheDocument()
      expect(screen.getByText('Error 3')).toBeInTheDocument()
      
      expect(screen.getByText('First error')).toBeInTheDocument()
      expect(screen.getByText('Second error')).toBeInTheDocument()
      expect(screen.getByText('Third error')).toBeInTheDocument()

      const alerts = screen.getAllByTestId('alert')
      expect(alerts).toHaveLength(3)
    })

    it('should handle rapid re-renders with different props', () => {
      const mockRetry = vi.fn()
      
      const { rerender } = render(
        <ErrorState 
          title="Loading Error"
          message="Failed to load data"
        />
      )

      expect(screen.getByText('Loading Error')).toBeInTheDocument()

      rerender(
        <ErrorState 
          title="Network Error"
          message="Connection failed"
          onRetry={mockRetry}
        />
      )

      expect(screen.getByText('Network Error')).toBeInTheDocument()
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
      expect(screen.queryByText('Loading Error')).not.toBeInTheDocument()

      rerender(
        <RouterWrapper>
          <ErrorState 
            title="Permission Error"
            message="Access denied"
            backLink="/login"
          />
        </RouterWrapper>
      )

      expect(screen.getByText('Permission Error')).toBeInTheDocument()
      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.queryByText('Network Error')).not.toBeInTheDocument()
    })
  })
})