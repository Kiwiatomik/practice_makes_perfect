import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePrompt } from './usePrompt'
import { aiService } from '../services/aiService'
import { coursesService } from '../services/coursesService'
import { useAuth } from '../contexts/AuthContext'
import { Prompt } from '../types'

// Mock the services
vi.mock('../services/aiService')
vi.mock('../services/coursesService')
vi.mock('../contexts/AuthContext')

const mockAiService = vi.mocked(aiService)
const mockCoursesService = vi.mocked(coursesService)
const mockUseAuth = vi.mocked(useAuth)

// Helper to create mock prompts
const createMockPrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: 'prompt-123',
  text: 'Find the derivative of x^2 + 3x + 1',
  answer: '2x + 3',
  answerType: 'equation',
  workings: [
    { format: 'title', content: 'Solution' },
    { format: 'paragraph', content: 'Using the power rule...' }
  ],
  abstractionLevel: 0,
  difficulty: 'Medium',
  level: 'Bachelor',
  createdAt: new Date(),
  ...overrides
})

describe('usePrompt hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default auth mock - authenticated user
    mockUseAuth.mockReturnValue({
      currentUser: { uid: 'test-user', email: 'test@example.com' } as any,
      loading: false,
    } as any)
    
    // Console spies
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('initialization', () => {
    it('should initialize with empty state when no initial prompt provided', () => {
      const { result } = renderHook(() => usePrompt(null))
      
      expect(result.current.promptState).toEqual({
        id: null,
        text: '',
        workings: null,
        answer: null,
        answerType: null,
        abstractionLevel: 0,
        isGeneratingQuestion: false,
        questionGenerationError: null,
        isLoadingSolution: false,
        solutionError: null,
        solution: null,
        requiresAuth: false
      })
    })

    it('should initialize with prompt data when initial prompt provided', () => {
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      expect(result.current.promptState.id).toBe('prompt-123')
      expect(result.current.promptState.text).toBe('Find the derivative of x^2 + 3x + 1')
      expect(result.current.promptState.answer).toBe('2x + 3')
      expect(result.current.promptState.answerType).toBe('equation')
      expect(result.current.promptState.workings).toHaveLength(2)
      expect(result.current.promptState.abstractionLevel).toBe(0)
    })

    it('should update state when initialPrompt changes', () => {
      const initialPrompt = createMockPrompt({ id: 'prompt-1', text: 'Question 1' })
      const { result, rerender } = renderHook(
        ({ prompt }) => usePrompt(prompt),
        { initialProps: { prompt: initialPrompt } }
      )
      
      expect(result.current.promptState.text).toBe('Question 1')
      
      const newPrompt = createMockPrompt({ id: 'prompt-2', text: 'Question 2' })
      rerender({ prompt: newPrompt })
      
      expect(result.current.promptState.text).toBe('Question 2')
      expect(result.current.promptState.id).toBe('prompt-2')
    })
  })

  describe('solveQuestionWithAI', () => {
    it('should not call AI if no prompt text', async () => {
      const { result } = renderHook(() => usePrompt(null))
      
      await act(async () => {
        await result.current.solveQuestionWithAI()
      })
      
      expect(mockAiService.solveQuestionWithAI).not.toHaveBeenCalled()
    })

    it('should set requiresAuth when user not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false,
      } as any)
      
      const mockPrompt = createMockPrompt({ workings: undefined })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        await result.current.solveQuestionWithAI()
      })
      
      expect(result.current.promptState.requiresAuth).toBe(true)
      expect(mockAiService.solveQuestionWithAI).not.toHaveBeenCalled()
    })

    it('should use existing workings instead of calling AI', async () => {
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        await result.current.solveQuestionWithAI()
      })
      
      expect(result.current.promptState.solution).toBe('workings')
      expect(mockAiService.solveQuestionWithAI).not.toHaveBeenCalled()
    })

    it('should call AI service when no workings available', async () => {
      const mockResponse = JSON.stringify({
        workings: [
          { format: 'title', content: 'AI Solution' },
          { format: 'paragraph', content: 'Step by step...' }
        ],
        answer: '2x + 3'
      })
      
      mockAiService.solveQuestionWithAI.mockResolvedValue(mockResponse)
      
      const mockPrompt = createMockPrompt({ workings: undefined })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        await result.current.solveQuestionWithAI('course-123', 'lesson-456')
      })
      
      expect(mockAiService.solveQuestionWithAI).toHaveBeenCalledWith(
        'Find the derivative of x^2 + 3x + 1',
        'course-123',
        'lesson-456'
      )
      expect(result.current.promptState.workings).toHaveLength(2)
      expect(result.current.promptState.answer).toBe('2x + 3')
      expect(result.current.promptState.solution).toBe('workings')
      expect(result.current.promptState.isLoadingSolution).toBe(false)
    })

    it('should handle AI response with markdown code blocks', async () => {
      const mockResponse = '```json\n{"workings": [{"format": "title", "content": "Solution"}], "answer": "result"}\n```'
      mockAiService.solveQuestionWithAI.mockResolvedValue(mockResponse)
      
      const mockPrompt = createMockPrompt({ workings: undefined })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        await result.current.solveQuestionWithAI()
      })
      
      expect(result.current.promptState.workings).toEqual([
        { format: 'title', content: 'Solution' }
      ])
      expect(result.current.promptState.answer).toBe('result')
    })

    it('should handle AI service errors gracefully', async () => {
      mockAiService.solveQuestionWithAI.mockRejectedValue(new Error('API Error'))
      
      const mockPrompt = createMockPrompt({ workings: undefined })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        await result.current.solveQuestionWithAI()
      })
      
      expect(result.current.promptState.solutionError).toBe('API Error')
      expect(result.current.promptState.isLoadingSolution).toBe(false)
    })

    it('should handle JSON parse errors gracefully', async () => {
      mockAiService.solveQuestionWithAI.mockResolvedValue('invalid json response')
      
      const mockPrompt = createMockPrompt({ workings: undefined })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        await result.current.solveQuestionWithAI()
      })
      
      expect(result.current.promptState.solution).toBe('invalid json response')
      expect(result.current.promptState.isLoadingSolution).toBe(false)
    })

    it('should set loading states correctly during operation', async () => {
      let resolvePromise: (value: string) => void
      const aiPromise = new Promise<string>((resolve) => {
        resolvePromise = resolve
      })
      mockAiService.solveQuestionWithAI.mockReturnValue(aiPromise)
      
      const mockPrompt = createMockPrompt({ workings: undefined })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      // Start the operation
      act(() => {
        result.current.solveQuestionWithAI()
      })
      
      // Should be loading
      expect(result.current.promptState.isLoadingSolution).toBe(true)
      expect(result.current.promptState.solutionError).toBeNull()
      
      // Resolve the promise
      await act(async () => {
        resolvePromise!('{"answer": "test"}')
        await aiPromise
      })
      
      // Should no longer be loading
      expect(result.current.promptState.isLoadingSolution).toBe(false)
    })
  })

  describe('generateQuestion', () => {
    it('should require authentication', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false,
      } as any)
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('practice')
        expect(success).toBe(false)
      })
      
      expect(result.current.promptState.requiresAuth).toBe(true)
      expect(mockAiService.generatePracticeQuestion).not.toHaveBeenCalled()
    })

    it('should generate practice question successfully', async () => {
      const mockResponse = JSON.stringify({
        new_question: 'Find the derivative of x^3 + 2x + 1',
        workings: [{ format: 'title', content: 'Practice Solution' }],
        answer: '3x^2 + 2'
      })
      
      mockAiService.generatePracticeQuestion.mockResolvedValue(mockResponse)
      mockCoursesService.createPrompt.mockResolvedValue('new-prompt-id')
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('practice', 'course-123', 'lesson-456')
        expect(success).toBe(true)
      })
      
      expect(mockAiService.generatePracticeQuestion).toHaveBeenCalledWith('Find the derivative of x^2 + 3x + 1')
      expect(result.current.promptState.text).toBe('Find the derivative of x^3 + 2x + 1')
      expect(result.current.promptState.abstractionLevel).toBe(0) // Same level for practice
      expect(result.current.promptState.id).toBe('new-prompt-id')
      expect(result.current.promptState.isGeneratingQuestion).toBe(false)
    })

    it('should generate next level question with incremented abstraction', async () => {
      const mockResponse = JSON.stringify({
        next_level_question: 'Find the derivative of ax^2 + bx + c',
        workings: [{ format: 'title', content: 'Next Level Solution' }],
        answer: '2ax + b'
      })
      
      mockAiService.generateNextLevelQuestion.mockResolvedValue(mockResponse)
      mockCoursesService.createPrompt.mockResolvedValue('next-level-id')
      
      const mockPrompt = createMockPrompt({ abstractionLevel: 0 })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('nextLevel', 'course-123', 'lesson-456')
        expect(success).toBe(true)
      })
      
      expect(mockAiService.generateNextLevelQuestion).toHaveBeenCalledWith('Find the derivative of x^2 + 3x + 1')
      expect(result.current.promptState.text).toBe('Find the derivative of ax^2 + bx + c')
      expect(result.current.promptState.abstractionLevel).toBe(1) // Incremented for next level
      expect(result.current.promptState.id).toBe('next-level-id')
    })

    it('should work without saving to database when no courseId/lessonId', async () => {
      const mockResponse = JSON.stringify({
        new_question: 'Practice question',
        answer: 'Practice answer'
      })
      
      mockAiService.generatePracticeQuestion.mockResolvedValue(mockResponse)
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('practice')
        expect(success).toBe(true)
      })
      
      expect(mockCoursesService.createPrompt).not.toHaveBeenCalled()
      expect(result.current.promptState.text).toBe('Practice question')
      expect(result.current.promptState.id).toBeNull()
    })

    it('should handle database save errors gracefully', async () => {
      const mockResponse = JSON.stringify({
        new_question: 'Test question',
        answer: 'Test answer'
      })
      
      mockAiService.generatePracticeQuestion.mockResolvedValue(mockResponse)
      mockCoursesService.createPrompt.mockRejectedValue(new Error('Database error'))
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('practice', 'course-123', 'lesson-456')
        expect(success).toBe(true) // Should still succeed
      })
      
      expect(result.current.promptState.text).toBe('Test question')
      expect(result.current.promptState.id).toBeNull() // No ID since save failed
    })

    it('should handle AI service errors', async () => {
      mockAiService.generatePracticeQuestion.mockRejectedValue(new Error('AI Error'))
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('practice')
        expect(success).toBe(false)
      })
      
      expect(result.current.promptState.questionGenerationError).toBe('AI Error')
      expect(result.current.promptState.isGeneratingQuestion).toBe(false)
    })

    it('should handle JSON parsing errors', async () => {
      mockAiService.generatePracticeQuestion.mockResolvedValue('invalid json')
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('practice')
        expect(success).toBe(false)
      })
      
      expect(result.current.promptState.questionGenerationError).toContain('Failed to parse')
      expect(result.current.promptState.isGeneratingQuestion).toBe(false)
    })

    it('should handle missing question in response', async () => {
      const mockResponse = JSON.stringify({
        // Missing new_question field for practice question
        answer: 'Test answer'
      })
      
      mockAiService.generatePracticeQuestion.mockResolvedValue(mockResponse)
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        const success = await result.current.generateQuestion('practice')
        expect(success).toBe(false)
      })
      
      // The parsing succeeds but throws error for missing field, caught by parseError catch
      expect(result.current.promptState.questionGenerationError).toContain('Failed to parse')
    })

    it('should preserve answerType from initial prompt', async () => {
      const mockResponse = JSON.stringify({
        new_question: 'New question',
        answer: 'New answer'
      })
      
      mockAiService.generatePracticeQuestion.mockResolvedValue(mockResponse)
      
      const mockPrompt = createMockPrompt({ answerType: 'number' })
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      await act(async () => {
        await result.current.generateQuestion('practice')
      })
      
      expect(result.current.promptState.answerType).toBe('number')
    })
  })

  describe('resetToOriginal', () => {
    it('should reset to original prompt state', () => {
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      // Modify state
      act(() => {
        result.current.promptState.isGeneratingQuestion = true
        result.current.promptState.text = 'Modified text'
      })
      
      // Reset
      act(() => {
        result.current.resetToOriginal()
      })
      
      expect(result.current.promptState.text).toBe('Find the derivative of x^2 + 3x + 1')
      expect(result.current.promptState.isGeneratingQuestion).toBe(false)
      expect(result.current.promptState.solution).toBeNull()
    })

    it('should handle reset when no initial prompt', () => {
      const { result } = renderHook(() => usePrompt(null))
      
      expect(() => {
        act(() => {
          result.current.resetToOriginal()
        })
      }).not.toThrow()
    })
  })

  describe('clearAuthRequirement', () => {
    it('should clear auth requirement flag', () => {
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      // Set auth requirement
      act(() => {
        result.current.promptState.requiresAuth = true
      })
      
      expect(result.current.promptState.requiresAuth).toBe(true)
      
      // Clear it
      act(() => {
        result.current.clearAuthRequirement()
      })
      
      expect(result.current.promptState.requiresAuth).toBe(false)
    })
  })

  describe('edge cases and integration', () => {
    it('should handle multiple rapid operations correctly', async () => {
      const mockResponse = JSON.stringify({ new_question: 'Question', answer: 'Answer' })
      mockAiService.generatePracticeQuestion.mockResolvedValue(mockResponse)
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      // Start multiple operations rapidly
      await act(async () => {
        const promise1 = result.current.generateQuestion('practice')
        const promise2 = result.current.generateQuestion('practice')
        await Promise.all([promise1, promise2])
      })
      
      // Should handle gracefully without errors
      expect(result.current.promptState.isGeneratingQuestion).toBe(false)
    })

    it('should preserve state consistency during failures', async () => {
      mockAiService.generatePracticeQuestion.mockRejectedValue(new Error('Network error'))
      
      const mockPrompt = createMockPrompt()
      const { result } = renderHook(() => usePrompt(mockPrompt))
      
      const originalState = { ...result.current.promptState }
      
      await act(async () => {
        await result.current.generateQuestion('practice')
      })
      
      // Original question should remain unchanged on failure
      expect(result.current.promptState.text).toBe(originalState.text)
      expect(result.current.promptState.id).toBe(originalState.id)
      expect(result.current.promptState.isGeneratingQuestion).toBe(false)
      expect(result.current.promptState.questionGenerationError).toBeTruthy()
    })

    it('should handle complex JSON parsing scenarios', async () => {
      const responses = [
        '```json\n{"new_question": "Q1"}\n```',
        '```\n{"new_question": "Q2"}\n```', 
        '{"new_question": "Q3"}',
        '   {"new_question": "Q4"}   '
      ]
      
      const mockPrompt = createMockPrompt()
      
      for (const response of responses) {
        mockAiService.generatePracticeQuestion.mockResolvedValueOnce(response)
        
        const { result } = renderHook(() => usePrompt(mockPrompt))
        
        await act(async () => {
          const success = await result.current.generateQuestion('practice')
          expect(success).toBe(true)
        })
        
        expect(result.current.promptState.text).toMatch(/Q[1-4]/)
      }
    })
  })
})