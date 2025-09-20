import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useModalBlurEffect } from './useModalBlurEffect'
import { useEffect } from 'react'

// Mock React's useEffect
vi.mock('react', () => ({
  useEffect: vi.fn()
}))

const mockUseEffect = vi.mocked(useEffect)

describe('useModalBlurEffect hook', () => {
  let mockBody: any
  let mockRootElement: any
  let originalGetElementById: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock elements
    mockBody = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn()
      }
    }
    
    mockRootElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn()
      }
    }

    // Mock document.body
    Object.defineProperty(document, 'body', {
      value: mockBody,
      writable: true,
      configurable: true
    })

    // Mock document.getElementById
    originalGetElementById = document.getElementById
    document.getElementById = vi.fn((id: string) => {
      if (id === 'root') return mockRootElement
      return null
    })

    // Setup useEffect mock to immediately call the effect function
    mockUseEffect.mockImplementation((effectFn) => {
      effectFn()
    })
  })

  afterEach(() => {
    // Restore original getElementById
    document.getElementById = originalGetElementById
  })

  describe('when show is true', () => {
    it('should add blur classes to root element and body', () => {
      useModalBlurEffect({ show: true })

      expect(mockRootElement.classList.add).toHaveBeenCalledWith('modal-blur-active')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-blur-active')
    })

    it('should call document.getElementById with "root"', () => {
      useModalBlurEffect({ show: true })

      expect(document.getElementById).toHaveBeenCalledWith('root')
    })

    it('should add classes in correct order', () => {
      useModalBlurEffect({ show: true })

      // Verify the sequence of calls
      const rootAddCalls = mockRootElement.classList.add.mock.calls
      const bodyAddCalls = mockBody.classList.add.mock.calls

      expect(rootAddCalls).toHaveLength(1)
      expect(rootAddCalls[0][0]).toBe('modal-blur-active')

      expect(bodyAddCalls).toHaveLength(2)
      expect(bodyAddCalls[0][0]).toBe('modal-scroll-lock')
      expect(bodyAddCalls[1][0]).toBe('modal-blur-active')
    })

    it('should call useEffect with show dependency', () => {
      useModalBlurEffect({ show: true })

      expect(mockUseEffect).toHaveBeenCalledTimes(1)
      expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [true])
    })
  })

  describe('when show is false', () => {
    it('should remove blur classes from root element and body', () => {
      useModalBlurEffect({ show: false })

      expect(mockRootElement.classList.remove).toHaveBeenCalledWith('modal-blur-active')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-blur-active')
    })

    it('should not add any classes', () => {
      useModalBlurEffect({ show: false })

      expect(mockRootElement.classList.add).not.toHaveBeenCalled()
      expect(mockBody.classList.add).not.toHaveBeenCalled()
    })

    it('should remove classes in correct order', () => {
      useModalBlurEffect({ show: false })

      const rootRemoveCalls = mockRootElement.classList.remove.mock.calls
      const bodyRemoveCalls = mockBody.classList.remove.mock.calls

      expect(rootRemoveCalls).toHaveLength(1)
      expect(rootRemoveCalls[0][0]).toBe('modal-blur-active')

      expect(bodyRemoveCalls).toHaveLength(2)
      expect(bodyRemoveCalls[0][0]).toBe('modal-scroll-lock')
      expect(bodyRemoveCalls[1][0]).toBe('modal-blur-active')
    })

    it('should call useEffect with show dependency', () => {
      useModalBlurEffect({ show: false })

      expect(mockUseEffect).toHaveBeenCalledTimes(1)
      expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [false])
    })
  })

  describe('when root element is not found', () => {
    beforeEach(() => {
      // Mock getElementById to return null for root
      document.getElementById = vi.fn(() => null)
    })

    it('should handle missing root element gracefully when show is true', () => {
      expect(() => {
        useModalBlurEffect({ show: true })
      }).not.toThrow()

      // Body should still be affected
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-blur-active')
    })

    it('should handle missing root element gracefully when show is false', () => {
      expect(() => {
        useModalBlurEffect({ show: false })
      }).not.toThrow()

      // Body should still be affected
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-blur-active')
    })
  })

  describe('effect cleanup', () => {
    it('should return a cleanup function that removes all classes', () => {
      let cleanupFn: any

      mockUseEffect.mockImplementation((effectFn) => {
        cleanupFn = effectFn()
      })

      useModalBlurEffect({ show: true })

      expect(cleanupFn).toBeTypeOf('function')

      // Clear previous calls
      vi.clearAllMocks()

      // Call cleanup function
      cleanupFn!()

      expect(mockRootElement.classList.remove).toHaveBeenCalledWith('modal-blur-active')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-blur-active')
    })

    it('should cleanup gracefully when root element is null', () => {
      let cleanupFn: any

      mockUseEffect.mockImplementation((effectFn) => {
        cleanupFn = effectFn()
      })

      // Make root element null
      document.getElementById = vi.fn(() => null)

      useModalBlurEffect({ show: true })

      expect(() => {
        cleanupFn!()
      }).not.toThrow()

      // Body cleanup should still work
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-blur-active')
    })
  })

  describe('dependency tracking', () => {
    it('should pass correct dependencies to useEffect', () => {
      useModalBlurEffect({ show: true })
      expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [true])

      vi.clearAllMocks()

      useModalBlurEffect({ show: false })
      expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [false])
    })

    it('should call useEffect only once per hook call', () => {
      useModalBlurEffect({ show: true })
      expect(mockUseEffect).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()

      useModalBlurEffect({ show: false })
      expect(mockUseEffect).toHaveBeenCalledTimes(1)
    })
  })

  describe('DOM element verification', () => {
    it('should access correct DOM elements', () => {
      useModalBlurEffect({ show: true })

      // Verify that getElementById was called for 'root'
      expect(document.getElementById).toHaveBeenCalledWith('root')
      
      // Verify that the correct elements were manipulated
      expect(mockRootElement.classList.add).toHaveBeenCalled()
      expect(mockBody.classList.add).toHaveBeenCalled()
    })

    it('should work when document.body is available', () => {
      expect(() => useModalBlurEffect({ show: true })).not.toThrow()
      expect(mockBody.classList.add).toHaveBeenCalled()
    })

    it('should apply correct CSS classes', () => {
      useModalBlurEffect({ show: true })

      // Root element should get modal-blur-active
      expect(mockRootElement.classList.add).toHaveBeenCalledWith('modal-blur-active')
      
      // Body should get both modal-scroll-lock and modal-blur-active
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-blur-active')
    })

    it('should remove correct CSS classes', () => {
      useModalBlurEffect({ show: false })

      // Root element should have modal-blur-active removed
      expect(mockRootElement.classList.remove).toHaveBeenCalledWith('modal-blur-active')
      
      // Body should have both classes removed
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-blur-active')
    })
  })

  describe('edge cases', () => {
    it('should handle null getElementById result', () => {
      document.getElementById = vi.fn(() => null)
      
      expect(() => useModalBlurEffect({ show: true })).not.toThrow()
      
      // Body operations should still work
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-blur-active')
    })

    it('should handle undefined getElementById result', () => {
      document.getElementById = vi.fn(() => undefined as any)
      
      expect(() => useModalBlurEffect({ show: true })).not.toThrow()
      
      // Body operations should still work
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-blur-active')
    })

    it('should work with different boolean values', () => {
      // Test with explicit true
      useModalBlurEffect({ show: true })
      
      expect(mockRootElement.classList.add).toHaveBeenCalledWith('modal-blur-active')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-blur-active')
      
      vi.clearAllMocks()
      
      // Test with explicit false
      useModalBlurEffect({ show: false })
      
      expect(mockRootElement.classList.remove).toHaveBeenCalledWith('modal-blur-active')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-blur-active')
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple hook calls with different show values', () => {
      useModalBlurEffect({ show: true })
      useModalBlurEffect({ show: false })

      // Both add and remove should have been called
      expect(mockRootElement.classList.add).toHaveBeenCalledWith('modal-blur-active')
      expect(mockRootElement.classList.remove).toHaveBeenCalledWith('modal-blur-active')
      expect(mockBody.classList.add).toHaveBeenCalledWith('modal-scroll-lock')
      expect(mockBody.classList.remove).toHaveBeenCalledWith('modal-scroll-lock')
    })

    it('should work correctly with multiple true calls', () => {
      useModalBlurEffect({ show: true })
      useModalBlurEffect({ show: true })

      // Should have called add twice
      expect(mockRootElement.classList.add).toHaveBeenCalledTimes(2)
      expect(mockBody.classList.add).toHaveBeenCalledTimes(4) // 2 calls per invocation
    })

    it('should work correctly with multiple false calls', () => {
      useModalBlurEffect({ show: false })
      useModalBlurEffect({ show: false })

      // Should have called remove twice
      expect(mockRootElement.classList.remove).toHaveBeenCalledTimes(2)
      expect(mockBody.classList.remove).toHaveBeenCalledTimes(4) // 2 calls per invocation
    })
  })
})