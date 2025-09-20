import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLesson } from './useLesson'
import { coursesService } from '../services/coursesService'
import { Lesson, Prompt } from '../types'

vi.mock('../services/coursesService')

const mockCoursesService = vi.mocked(coursesService)

// Helper to create mock lesson
const createMockLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'lesson-123',
  title: 'Introduction to Derivatives',
  description: 'Learn the basics of derivatives',
  content: 'Derivatives are fundamental in calculus...',
  order: 1,
  duration: 45,
  difficulty: 'Medium',
  isCompleted: false,
  courseId: 'course-123',
  createdBy: {
    id: 'user-123',
    email: 'instructor@example.com',
    displayName: 'Dr. Math',
    createdAt: new Date(),
    lastActive: new Date()
  },
  ...overrides
})

// Helper to create mock prompt
const createMockPrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: 'prompt-123',
  text: 'Find the derivative of x^2',
  answer: '2x',
  answerType: 'equation',
  workings: [
    { format: 'title', content: 'Solution' },
    { format: 'paragraph', content: 'Using power rule...' }
  ],
  abstractionLevel: 0,
  difficulty: 'Medium',
  level: 'Bachelor',
  createdAt: new Date(),
  ...overrides
})

describe('useLesson hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('initialization', () => {
    it('should initialize with correct default state', async () => {
      // Mock slow responses to test initial state
      let resolveLessonPromise: (value: Lesson) => void
      let resolvePromptPromise: (value: Prompt | null) => void
      
      const lessonPromise = new Promise<Lesson>((resolve) => {
        resolveLessonPromise = resolve
      })
      const promptPromise = new Promise<Prompt | null>((resolve) => {
        resolvePromptPromise = resolve
      })
      
      mockCoursesService.getLessonById.mockReturnValue(lessonPromise)
      mockCoursesService.getFirstPromptByLessonId.mockReturnValue(promptPromise)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      // Check initial state
      expect(result.current.lesson).toBeNull()
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.firstPrompt).toBeNull()
      expect(typeof result.current.refetch).toBe('function')
      
      // Clean up promises
      await act(async () => {
        resolveLessonPromise!(createMockLesson())
        resolvePromptPromise!(null)
        await Promise.all([lessonPromise, promptPromise])
      })
    })

    it('should handle missing courseId and lessonId', async () => {
      const { result } = renderHook(() => useLesson(undefined, undefined))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.error).toBe('Course ID and Lesson ID are required')
      expect(result.current.lesson).toBeNull()
      expect(mockCoursesService.getLessonById).not.toHaveBeenCalled()
      expect(mockCoursesService.getFirstPromptByLessonId).not.toHaveBeenCalled()
    })

    it('should handle missing courseId only', async () => {
      const { result } = renderHook(() => useLesson(undefined, 'lesson-456'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.error).toBe('Course ID and Lesson ID are required')
      expect(mockCoursesService.getLessonById).not.toHaveBeenCalled()
    })

    it('should handle missing lessonId only', async () => {
      const { result } = renderHook(() => useLesson('course-123', undefined))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.error).toBe('Course ID and Lesson ID are required')
      expect(mockCoursesService.getLessonById).not.toHaveBeenCalled()
    })
  })

  describe('lesson fetching', () => {
    it('should fetch lesson successfully', async () => {
      const mockLesson = createMockLesson()
      mockCoursesService.getLessonById.mockResolvedValue(mockLesson)
      mockCoursesService.getFirstPromptByLessonId.mockResolvedValue(null)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      expect(result.current.loading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(mockCoursesService.getLessonById).toHaveBeenCalledWith('course-123', 'lesson-456')
      expect(result.current.lesson).toEqual(mockLesson)
      expect(result.current.error).toBeNull()
    })

    it('should handle lesson fetching errors', async () => {
      const errorMessage = 'Failed to fetch lesson'
      mockCoursesService.getLessonById.mockRejectedValue(new Error(errorMessage))
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.lesson).toBeNull()
      expect(result.current.error).toBe(errorMessage)
    })

    it('should handle non-Error objects in lesson fetching', async () => {
      mockCoursesService.getLessonById.mockRejectedValue('String error')
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.error).toBe('Failed to load lesson')
    })

    it('should clear error on successful refetch', async () => {
      const mockLesson = createMockLesson()
      
      // First call fails
      mockCoursesService.getLessonById
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockLesson)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
      
      // Refetch
      await act(async () => {
        await result.current.refetch()
      })
      
      expect(result.current.error).toBeNull()
      expect(result.current.lesson).toEqual(mockLesson)
    })

    it('should set loading state correctly during fetch', async () => {
      const mockLesson = createMockLesson()
      
      let resolvePromise: (value: Lesson) => void
      const lessonPromise = new Promise<Lesson>((resolve) => {
        resolvePromise = resolve
      })
      
      mockCoursesService.getLessonById.mockReturnValue(lessonPromise)
      mockCoursesService.getFirstPromptByLessonId.mockResolvedValue(null)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      // Should be loading initially
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()
      
      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockLesson)
        await lessonPromise
      })
      
      // Should no longer be loading
      expect(result.current.loading).toBe(false)
      expect(result.current.lesson).toEqual(mockLesson)
    })
  })

  describe('prompt fetching', () => {
    it('should fetch first prompt successfully', async () => {
      const mockLesson = createMockLesson()
      const mockPrompt = createMockPrompt()
      
      mockCoursesService.getLessonById.mockResolvedValue(mockLesson)
      mockCoursesService.getFirstPromptByLessonId.mockResolvedValue(mockPrompt)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      await waitFor(() => {
        expect(result.current.promptLoading).toBe(false)
      })
      
      expect(mockCoursesService.getFirstPromptByLessonId).toHaveBeenCalledWith('course-123', 'lesson-456')
      expect(result.current.firstPrompt).toEqual(mockPrompt)
    })

    it('should handle prompt fetching errors gracefully', async () => {
      const mockLesson = createMockLesson()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockCoursesService.getLessonById.mockResolvedValue(mockLesson)
      mockCoursesService.getFirstPromptByLessonId.mockRejectedValue(new Error('Prompt not found'))
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      await waitFor(() => {
        expect(result.current.promptLoading).toBe(false)
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching prompt:', expect.any(Error))
      expect(result.current.firstPrompt).toBeNull()
      expect(result.current.error).toBeNull() // Should not set error for prompt failures
      
      consoleSpy.mockRestore()
    })

    it('should not fetch prompt if courseId or lessonId missing', async () => {
      const { result } = renderHook(() => useLesson(undefined, 'lesson-456'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(mockCoursesService.getFirstPromptByLessonId).not.toHaveBeenCalled()
      expect(result.current.promptLoading).toBe(false)
      expect(result.current.firstPrompt).toBeNull()
    })

    it('should set prompt loading state correctly', async () => {
      const mockLesson = createMockLesson()
      
      let resolvePromise: (value: Prompt | null) => void
      const promptPromise = new Promise<Prompt | null>((resolve) => {
        resolvePromise = resolve
      })
      
      mockCoursesService.getLessonById.mockResolvedValue(mockLesson)
      mockCoursesService.getFirstPromptByLessonId.mockReturnValue(promptPromise)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      // Wait for lesson to load first
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Prompt should be loading
      expect(result.current.promptLoading).toBe(true)
      
      // Resolve prompt promise
      await act(async () => {
        resolvePromise!(null)
        await promptPromise
      })
      
      // Should no longer be loading
      expect(result.current.promptLoading).toBe(false)
    })
  })

  describe('parameter changes', () => {
    it('should refetch when courseId changes', async () => {
      const mockLesson1 = createMockLesson({ id: 'lesson-1', title: 'Lesson 1' })
      const mockLesson2 = createMockLesson({ id: 'lesson-2', title: 'Lesson 2' })
      
      mockCoursesService.getLessonById
        .mockResolvedValueOnce(mockLesson1)
        .mockResolvedValueOnce(mockLesson2)
      
      mockCoursesService.getFirstPromptByLessonId.mockResolvedValue(null)
      
      const { result, rerender } = renderHook(
        ({ courseId, lessonId }) => useLesson(courseId, lessonId),
        { initialProps: { courseId: 'course-1', lessonId: 'lesson-456' } }
      )
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.lesson?.title).toBe('Lesson 1')
      })
      
      // Change courseId
      rerender({ courseId: 'course-2', lessonId: 'lesson-456' })
      
      // Should fetch new lesson
      await waitFor(() => {
        expect(result.current.lesson?.title).toBe('Lesson 2')
      })
      
      expect(mockCoursesService.getLessonById).toHaveBeenCalledTimes(2)
      expect(mockCoursesService.getLessonById).toHaveBeenNthCalledWith(1, 'course-1', 'lesson-456')
      expect(mockCoursesService.getLessonById).toHaveBeenNthCalledWith(2, 'course-2', 'lesson-456')
    })

    it('should refetch when lessonId changes', async () => {
      const mockLesson1 = createMockLesson({ id: 'lesson-1', title: 'Lesson 1' })
      const mockLesson2 = createMockLesson({ id: 'lesson-2', title: 'Lesson 2' })
      
      mockCoursesService.getLessonById
        .mockResolvedValueOnce(mockLesson1)
        .mockResolvedValueOnce(mockLesson2)
      
      mockCoursesService.getFirstPromptByLessonId.mockResolvedValue(null)
      
      const { result, rerender } = renderHook(
        ({ courseId, lessonId }) => useLesson(courseId, lessonId),
        { initialProps: { courseId: 'course-123', lessonId: 'lesson-1' } }
      )
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.lesson?.title).toBe('Lesson 1')
      })
      
      // Change lessonId
      rerender({ courseId: 'course-123', lessonId: 'lesson-2' })
      
      // Should fetch new lesson
      await waitFor(() => {
        expect(result.current.lesson?.title).toBe('Lesson 2')
      })
      
      expect(mockCoursesService.getLessonById).toHaveBeenCalledTimes(2)
      expect(mockCoursesService.getLessonById).toHaveBeenNthCalledWith(1, 'course-123', 'lesson-1')
      expect(mockCoursesService.getLessonById).toHaveBeenNthCalledWith(2, 'course-123', 'lesson-2')
    })

    it('should refetch prompts when parameters change', async () => {
      const mockLesson = createMockLesson()
      const mockPrompt1 = createMockPrompt({ id: 'prompt-1', text: 'Question 1' })
      const mockPrompt2 = createMockPrompt({ id: 'prompt-2', text: 'Question 2' })
      
      mockCoursesService.getLessonById.mockResolvedValue(mockLesson)
      mockCoursesService.getFirstPromptByLessonId
        .mockResolvedValueOnce(mockPrompt1)
        .mockResolvedValueOnce(mockPrompt2)
      
      const { result, rerender } = renderHook(
        ({ courseId, lessonId }) => useLesson(courseId, lessonId),
        { initialProps: { courseId: 'course-123', lessonId: 'lesson-1' } }
      )
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.firstPrompt?.text).toBe('Question 1')
      })
      
      // Change lessonId
      rerender({ courseId: 'course-123', lessonId: 'lesson-2' })
      
      // Should fetch new prompt
      await waitFor(() => {
        expect(result.current.firstPrompt?.text).toBe('Question 2')
      })
      
      expect(mockCoursesService.getFirstPromptByLessonId).toHaveBeenCalledTimes(2)
      expect(mockCoursesService.getFirstPromptByLessonId).toHaveBeenNthCalledWith(1, 'course-123', 'lesson-1')
      expect(mockCoursesService.getFirstPromptByLessonId).toHaveBeenNthCalledWith(2, 'course-123', 'lesson-2')
    })
  })

  describe('refetch function', () => {
    it('should refetch lesson data manually', async () => {
      const mockLesson1 = createMockLesson({ title: 'Original Title' })
      const mockLesson2 = createMockLesson({ title: 'Updated Title' })
      
      mockCoursesService.getLessonById
        .mockResolvedValueOnce(mockLesson1)
        .mockResolvedValueOnce(mockLesson2)
      
      mockCoursesService.getFirstPromptByLessonId.mockResolvedValue(null)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.lesson?.title).toBe('Original Title')
      })
      
      // Manual refetch
      await act(async () => {
        await result.current.refetch()
      })
      
      expect(result.current.lesson?.title).toBe('Updated Title')
      expect(mockCoursesService.getLessonById).toHaveBeenCalledTimes(2)
    })

    it('should handle refetch with missing parameters', async () => {
      const { result } = renderHook(() => useLesson(undefined, undefined))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Should not throw when refetching with missing params
      await act(async () => {
        await result.current.refetch()
      })
      
      expect(result.current.error).toBe('Course ID and Lesson ID are required')
    })

    it('should set loading state during manual refetch', async () => {
      const mockLesson = createMockLesson()
      
      let resolvePromise: (value: Lesson) => void
      const lessonPromise = new Promise<Lesson>((resolve) => {
        resolvePromise = resolve
      })
      
      mockCoursesService.getLessonById
        .mockResolvedValueOnce(mockLesson) // Initial load
        .mockReturnValueOnce(lessonPromise) // Refetch
      
      mockCoursesService.getFirstPromptByLessonId.mockResolvedValue(null)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Start manual refetch
      act(() => {
        result.current.refetch()
      })
      
      // Should be loading during refetch
      expect(result.current.loading).toBe(true)
      
      // Complete refetch
      await act(async () => {
        resolvePromise!(mockLesson)
        await lessonPromise
      })
      
      expect(result.current.loading).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('should handle lesson and prompt loading independently', async () => {
      const mockLesson = createMockLesson()
      const mockPrompt = createMockPrompt()
      
      // Lesson loads quickly, prompt takes longer
      let resolvePromptPromise: (value: Prompt) => void
      const promptPromise = new Promise<Prompt>((resolve) => {
        resolvePromptPromise = resolve
      })
      
      mockCoursesService.getLessonById.mockResolvedValue(mockLesson)
      mockCoursesService.getFirstPromptByLessonId.mockReturnValue(promptPromise)
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      // Lesson should load first
      await waitFor(() => {
        expect(result.current.lesson).toEqual(mockLesson)
        expect(result.current.loading).toBe(false)
      })
      
      // Prompt should still be loading
      expect(result.current.promptLoading).toBe(true)
      expect(result.current.firstPrompt).toBeNull()
      
      // Complete prompt loading
      await act(async () => {
        resolvePromptPromise!(mockPrompt)
        await promptPromise
      })
      
      expect(result.current.promptLoading).toBe(false)
      expect(result.current.firstPrompt).toEqual(mockPrompt)
    })

    it('should handle successful lesson fetch with failed prompt fetch', async () => {
      const mockLesson = createMockLesson()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockCoursesService.getLessonById.mockResolvedValue(mockLesson)
      mockCoursesService.getFirstPromptByLessonId.mockRejectedValue(new Error('No prompts'))
      
      const { result } = renderHook(() => useLesson('course-123', 'lesson-456'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.promptLoading).toBe(false)
      })
      
      // Lesson should be loaded successfully
      expect(result.current.lesson).toEqual(mockLesson)
      expect(result.current.error).toBeNull()
      
      // Prompt should remain null without affecting lesson state
      expect(result.current.firstPrompt).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching prompt:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})