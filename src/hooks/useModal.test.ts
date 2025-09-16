import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useModal, LATEX_REPLACEMENTS } from './useModal'

describe('useModal hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useModal())
      
      expect(result.current.modalState.show).toBe(false)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(false)
      expect(result.current.modalState.userAnswer).toBe('')
      expect(result.current.modalState.isCorrect).toBe(false)
      
      // Check function availability
      expect(typeof result.current.showModal).toBe('function')
      expect(typeof result.current.hideModal).toBe('function')
      expect(typeof result.current.setUserAnswer).toBe('function')
      expect(typeof result.current.submitAnswer).toBe('function')
      expect(typeof result.current.resetForNewQuestion).toBe('function')
    })
  })

  describe('modal visibility', () => {
    it('should show modal when showModal is called', () => {
      const { result } = renderHook(() => useModal())
      
      expect(result.current.modalState.show).toBe(false)
      
      act(() => {
        result.current.showModal()
      })
      
      expect(result.current.modalState.show).toBe(true)
    })

    it('should hide modal when hideModal is called', () => {
      const { result } = renderHook(() => useModal())
      
      // First show the modal
      act(() => {
        result.current.showModal()
      })
      expect(result.current.modalState.show).toBe(true)
      
      // Then hide it
      act(() => {
        result.current.hideModal()
      })
      expect(result.current.modalState.show).toBe(false)
    })

    it('should preserve other modal state when showing/hiding', () => {
      const { result } = renderHook(() => useModal())
      
      // Set user answer first
      act(() => {
        result.current.setUserAnswer('test answer')
      })
      
      // Show modal - should preserve answer
      act(() => {
        result.current.showModal()
      })
      
      expect(result.current.modalState.show).toBe(true)
      expect(result.current.modalState.userAnswer).toBe('test answer')
      
      // Hide modal - should preserve answer
      act(() => {
        result.current.hideModal()
      })
      
      expect(result.current.modalState.show).toBe(false)
      expect(result.current.modalState.userAnswer).toBe('test answer')
    })
  })

  describe('user answer management', () => {
    it('should set user answer', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('my answer')
      })
      
      expect(result.current.modalState.userAnswer).toBe('my answer')
    })

    it('should update user answer multiple times', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('first answer')
      })
      expect(result.current.modalState.userAnswer).toBe('first answer')
      
      act(() => {
        result.current.setUserAnswer('second answer')
      })
      expect(result.current.modalState.userAnswer).toBe('second answer')
    })

    it('should preserve other state when setting user answer', () => {
      const { result } = renderHook(() => useModal())
      
      // Show modal first
      act(() => {
        result.current.showModal()
      })
      
      // Set answer - should preserve show state
      act(() => {
        result.current.setUserAnswer('test')
      })
      
      expect(result.current.modalState.show).toBe(true)
      expect(result.current.modalState.userAnswer).toBe('test')
      expect(result.current.modalState.hasSubmittedAnswer).toBe(false)
    })
  })

  describe('answer submission without correct answer', () => {
    it('should mark as submitted when submitAnswer is called without correct answer', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('user answer')
        result.current.submitAnswer()
      })
      
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      expect(result.current.modalState.isCorrect).toBe(false)
    })

    it('should preserve user answer when submitting without correct answer', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('my answer')
        result.current.submitAnswer()
      })
      
      expect(result.current.modalState.userAnswer).toBe('my answer')
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
    })
  })

  describe('answer submission with correct answer', () => {
    it('should mark as correct when answers match exactly', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('42')
        result.current.submitAnswer('42', 'number')
      })
      
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      expect(result.current.modalState.isCorrect).toBe(true)
    })

    it('should mark as incorrect when answers do not match', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('41')
        result.current.submitAnswer('42', 'number')
      })
      
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      expect(result.current.modalState.isCorrect).toBe(false)
    })

    it('should handle case insensitive comparison for numbers', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('PI')
        result.current.submitAnswer('pi', 'number')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })

    it('should trim whitespace from answers', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('  42  ')
        result.current.submitAnswer('42', 'number')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })
  })

  describe('equation answer sanitization', () => {
    it('should remove spaces from equation answers', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('x + 2')
        result.current.submitAnswer('x+2', 'equation')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })

    it('should apply LaTeX replacements to equation answers', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('x <= 5')
        result.current.submitAnswer('x \\leq 5', 'equation')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })

    it('should apply multiple LaTeX replacements', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('3 <= x >= 1')
        result.current.submitAnswer('3\\leqx\\geq1', 'equation')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })

    it('should handle complex equation comparisons', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('  X >= 0  and  Y <= 10  ')
        result.current.submitAnswer('x\\geq0andy\\leq10', 'equation')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })
  })

  describe('answer sanitization edge cases', () => {
    it('should handle empty answers correctly', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('')
        result.current.submitAnswer('', 'number')
      })
      
      // Empty string is falsy, so correctAnswer check fails and returns false
      expect(result.current.modalState.isCorrect).toBe(false)
    })

    it('should handle whitespace-only answers correctly', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('   ')
        result.current.submitAnswer('', 'number')
      })
      
      // Empty string is falsy, so correctAnswer check fails and returns false
      expect(result.current.modalState.isCorrect).toBe(false)
    })

    it('should handle empty correct answer with non-empty user answer', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('some answer')
        result.current.submitAnswer('', 'number')
      })
      
      // Empty string is falsy, so correctAnswer check fails and returns false
      expect(result.current.modalState.isCorrect).toBe(false)
    })

    it('should handle actual empty string comparison when correct answer is provided', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.setUserAnswer('')
        result.current.submitAnswer('non-empty', 'number')
      })
      
      expect(result.current.modalState.isCorrect).toBe(false)
    })

    it('should handle special characters that need escaping in regex', () => {
      const { result } = renderHook(() => useModal())
      
      // Test characters that are special in regex: . * + ? ^ $ { } ( ) | [ ] \
      act(() => {
        result.current.setUserAnswer('x <= y')
        result.current.submitAnswer('x \\leq y', 'equation')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })
  })

  describe('resetForNewQuestion', () => {
    it('should reset answer-related state but preserve modal visibility', () => {
      const { result } = renderHook(() => useModal())
      
      // Set up state with all fields populated
      act(() => {
        result.current.showModal()
        result.current.setUserAnswer('test answer')
        result.current.submitAnswer('correct answer')
      })
      
      // Verify initial state
      expect(result.current.modalState.show).toBe(true)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      expect(result.current.modalState.userAnswer).toBe('test answer')
      expect(result.current.modalState.isCorrect).toBe(false)
      
      // Reset for new question
      act(() => {
        result.current.resetForNewQuestion()
      })
      
      // Should preserve show state but reset answer-related fields
      expect(result.current.modalState.show).toBe(true)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(false)
      expect(result.current.modalState.userAnswer).toBe('')
      expect(result.current.modalState.isCorrect).toBe(false)
    })

    it('should work when modal is hidden', () => {
      const { result } = renderHook(() => useModal())
      
      // Set up answer state without showing modal
      act(() => {
        result.current.setUserAnswer('answer')
        result.current.submitAnswer()
      })
      
      expect(result.current.modalState.show).toBe(false)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      
      // Reset should work
      act(() => {
        result.current.resetForNewQuestion()
      })
      
      expect(result.current.modalState.show).toBe(false)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(false)
      expect(result.current.modalState.userAnswer).toBe('')
      expect(result.current.modalState.isCorrect).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete workflow: show → answer → submit → correct', () => {
      const { result } = renderHook(() => useModal())
      
      // Show modal
      act(() => {
        result.current.showModal()
      })
      expect(result.current.modalState.show).toBe(true)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(false)
      
      // Enter answer
      act(() => {
        result.current.setUserAnswer('42')
      })
      expect(result.current.modalState.userAnswer).toBe('42')
      
      // Submit correct answer
      act(() => {
        result.current.submitAnswer('42', 'number')
      })
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      expect(result.current.modalState.isCorrect).toBe(true)
    })

    it('should handle complete workflow: show → answer → submit → incorrect → reset → new answer', () => {
      const { result } = renderHook(() => useModal())
      
      // Initial workflow
      act(() => {
        result.current.showModal()
        result.current.setUserAnswer('wrong')
        result.current.submitAnswer('correct')
      })
      
      expect(result.current.modalState.isCorrect).toBe(false)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      
      // Reset for new question
      act(() => {
        result.current.resetForNewQuestion()
      })
      
      expect(result.current.modalState.show).toBe(true) // Still shown
      expect(result.current.modalState.hasSubmittedAnswer).toBe(false)
      expect(result.current.modalState.userAnswer).toBe('')
      
      // New workflow
      act(() => {
        result.current.setUserAnswer('correct')
        result.current.submitAnswer('correct')
      })
      
      expect(result.current.modalState.isCorrect).toBe(true)
    })

    it('should handle equation workflow with LaTeX transformations', () => {
      const { result } = renderHook(() => useModal())
      
      act(() => {
        result.current.showModal()
        result.current.setUserAnswer('x >= 0 AND y <= 5')
        result.current.submitAnswer('x\\geq0andy\\leq5', 'equation')
      })
      
      expect(result.current.modalState.show).toBe(true)
      expect(result.current.modalState.hasSubmittedAnswer).toBe(true)
      expect(result.current.modalState.isCorrect).toBe(true)
      expect(result.current.modalState.userAnswer).toBe('x >= 0 AND y <= 5') // Original preserved
    })
  })

  describe('LATEX_REPLACEMENTS export', () => {
    it('should export LATEX_REPLACEMENTS constant', () => {
      expect(LATEX_REPLACEMENTS).toBeDefined()
      expect(typeof LATEX_REPLACEMENTS).toBe('object')
    })

    it('should contain expected LaTeX replacements', () => {
      expect(LATEX_REPLACEMENTS['<=']).toBe('\\leq')
      expect(LATEX_REPLACEMENTS['>=']).toBe('\\geq')
    })

    it('should only contain string mappings', () => {
      Object.entries(LATEX_REPLACEMENTS).forEach(([key, value]) => {
        expect(typeof key).toBe('string')
        expect(typeof value).toBe('string')
      })
    })
  })
})