import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingState from './LoadingState'
import React from 'react'

// Mock react-bootstrap/Container
vi.mock('react-bootstrap/Container', async () => {
  const React = await import('react')
  const MockContainer = React.forwardRef(({ children, className, ...props }: any, ref: any) => (
    React.createElement('div', {
      ref,
      'data-testid': 'container',
      className,
      ...props
    }, children)
  ))
  MockContainer.displayName = 'MockContainer'
  return {
    default: MockContainer
  }
})

describe('LoadingState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('default behavior', () => {
    it('should render loading spinner', () => {
      render(<LoadingState />)

      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('spinner-border')
    })

    it('should display default loading message in both places', () => {
      render(<LoadingState />)

      const messages = screen.getAllByText('Loading...')
      expect(messages).toHaveLength(2) // One hidden, one visible
    })

    it('should have visually hidden message for screen readers', () => {
      render(<LoadingState />)

      const spinner = screen.getByRole('status')
      const hiddenMessage = spinner.querySelector('.visually-hidden')
      expect(hiddenMessage).toHaveTextContent('Loading...')
    })

    it('should use Container with proper styling', () => {
      render(<LoadingState />)

      const container = screen.getByTestId('container')
      expect(container).toHaveClass('my-4')
    })

    it('should center the content', () => {
      render(<LoadingState />)

      const centerDiv = document.querySelector('.text-center')
      expect(centerDiv).toBeInTheDocument()
    })

    it('should display visible message with muted styling', () => {
      render(<LoadingState />)

      const messageP = document.querySelector('p.mt-2.text-muted')
      expect(messageP).toBeInTheDocument()
      expect(messageP).toHaveTextContent('Loading...')
    })
  })

  describe('custom messages', () => {
    it('should display custom loading message', () => {
      render(<LoadingState message="Fetching data..." />)

      const messages = screen.getAllByText('Fetching data...')
      expect(messages).toHaveLength(2)
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should display custom message in both hidden and visible elements', () => {
      render(<LoadingState message="Processing your request..." />)

      const messages = screen.getAllByText('Processing your request...')
      expect(messages).toHaveLength(2)

      // Check hidden message
      const spinner = screen.getByRole('status')
      const hiddenMessage = spinner.querySelector('.visually-hidden')
      expect(hiddenMessage).toHaveTextContent('Processing your request...')

      // Check visible message
      const visibleMessage = document.querySelector('p.text-muted')
      expect(visibleMessage).toHaveTextContent('Processing your request...')
    })

    it('should handle empty message', () => {
      render(<LoadingState message="" />)

      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()

      const hiddenSpan = spinner.querySelector('.visually-hidden')
      expect(hiddenSpan).toHaveTextContent('')

      const visibleP = document.querySelector('p.text-muted')
      expect(visibleP).toHaveTextContent('')
    })

    it('should handle long messages', () => {
      const longMessage = 'This is a very long loading message that should be displayed properly'
      
      render(<LoadingState message={longMessage} />)

      const messages = screen.getAllByText(longMessage)
      expect(messages).toHaveLength(2)
    })

    it('should handle special characters in messages', () => {
      const specialMessage = 'Loading... 📊 Processing data! 🚀'
      
      render(<LoadingState message={specialMessage} />)

      const messages = screen.getAllByText(specialMessage)
      expect(messages).toHaveLength(2)
    })

    it('should handle HTML-like strings safely', () => {
      const htmlLikeMessage = '<script>alert("test")</script>Loading data...'
      
      render(<LoadingState message={htmlLikeMessage} />)

      const messages = screen.getAllByText(htmlLikeMessage)
      expect(messages).toHaveLength(2)
      
      // Should not create script elements
      expect(document.querySelector('script')).toBeNull()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA role for spinner', () => {
      render(<LoadingState />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('role', 'status')
    })

    it('should provide screen reader text', () => {
      render(<LoadingState message="Saving changes..." />)

      const spinner = screen.getByRole('status')
      const hiddenText = spinner.querySelector('.visually-hidden')
      
      expect(hiddenText).toHaveTextContent('Saving changes...')
    })

    it('should have proper semantic structure', () => {
      render(<LoadingState message="Loading content..." />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      
      const visibleText = document.querySelector('p')
      expect(visibleText).toBeInTheDocument()
      expect(visibleText).toHaveTextContent('Loading content...')
    })
  })

  describe('visual styling', () => {
    it('should apply correct Bootstrap classes', () => {
      render(<LoadingState />)

      const container = screen.getByTestId('container')
      expect(container).toHaveClass('my-4')

      const centerDiv = document.querySelector('.text-center')
      expect(centerDiv).toBeInTheDocument()

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('spinner-border')

      const hiddenSpan = spinner.querySelector('.visually-hidden')
      expect(hiddenSpan).toBeInTheDocument()

      const messageP = document.querySelector('p')
      expect(messageP).toHaveClass('mt-2', 'text-muted')
    })

    it('should maintain consistent layout with different messages', () => {
      const { rerender } = render(<LoadingState message="Short" />)
      
      expect(screen.getByTestId('container')).toHaveClass('my-4')
      expect(document.querySelector('.text-center')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveClass('spinner-border')

      rerender(<LoadingState message="This is a much longer loading message" />)
      
      expect(screen.getByTestId('container')).toHaveClass('my-4')
      expect(document.querySelector('.text-center')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveClass('spinner-border')
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
          <LoadingState message="Testing integration..." />
        </TestWrapper>
      )

      expect(screen.getByTestId('parent-wrapper')).toBeInTheDocument()
      expect(screen.getAllByText('Testing integration...')).toHaveLength(2)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render multiple instances independently', () => {
      render(
        <>
          <LoadingState message="Loading users..." />
          <LoadingState message="Loading posts..." />
          <LoadingState message="Loading comments..." />
        </>
      )

      expect(screen.getAllByText('Loading users...')).toHaveLength(2)
      expect(screen.getAllByText('Loading posts...')).toHaveLength(2)
      expect(screen.getAllByText('Loading comments...')).toHaveLength(2)

      const spinners = screen.getAllByRole('status')
      expect(spinners).toHaveLength(3)
    })

    it('should handle rapid re-renders with different messages', () => {
      const { rerender } = render(<LoadingState message="Step 1..." />)
      expect(screen.getAllByText('Step 1...')).toHaveLength(2)

      rerender(<LoadingState message="Step 2..." />)
      expect(screen.getAllByText('Step 2...')).toHaveLength(2)
      expect(screen.queryByText('Step 1...')).not.toBeInTheDocument()

      rerender(<LoadingState message="Step 3..." />)
      expect(screen.getAllByText('Step 3...')).toHaveLength(2)
      expect(screen.queryByText('Step 2...')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined message prop', () => {
      render(<LoadingState message={undefined} />)

      const messages = screen.getAllByText('Loading...')
      expect(messages).toHaveLength(2)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should handle null message prop', () => {
      render(<LoadingState message={null as any} />)

      // Should not render any text when null
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      
      const hiddenSpan = spinner.querySelector('.visually-hidden')
      const visibleP = document.querySelector('p.text-muted')
      
      // Both should be empty or not have text content
      expect(hiddenSpan?.textContent).toBeFalsy()
      expect(visibleP?.textContent).toBeFalsy()
    })

    it('should handle numeric message prop', () => {
      render(<LoadingState message={42 as any} />)

      const messages = screen.getAllByText('42')
      expect(messages).toHaveLength(2)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should handle whitespace-only message', () => {
      render(<LoadingState message="   " />)

      const spinner = screen.getByRole('status')
      const hiddenSpan = spinner.querySelector('.visually-hidden')
      const visibleP = document.querySelector('p.text-muted')
      
      // Use textContent property directly since toHaveTextContent normalizes whitespace
      expect(hiddenSpan?.textContent).toBe('   ')
      expect(visibleP?.textContent).toBe('   ')
    })
  })

  describe('component structure', () => {
    it('should render the expected DOM structure', () => {
      render(<LoadingState message="Test message" />)

      const container = screen.getByTestId('container')
      expect(container).toHaveClass('my-4')

      const centerDiv = container.querySelector('.text-center')
      expect(centerDiv).toBeInTheDocument()

      const spinner = centerDiv?.querySelector('.spinner-border')
      expect(spinner).toHaveAttribute('role', 'status')

      const hiddenSpan = spinner?.querySelector('.visually-hidden')
      expect(hiddenSpan).toHaveTextContent('Test message')

      const messageP = centerDiv?.querySelector('p')
      expect(messageP).toHaveClass('mt-2', 'text-muted')
      expect(messageP).toHaveTextContent('Test message')
    })
  })
})