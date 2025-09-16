import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSearchCourses } from './useSearchCourses'
import { coursesService } from '../services/coursesService'
import { Course } from '../types'

// Mock the courses service
vi.mock('../services/coursesService', () => ({
  coursesService: {
    getAllCourses: vi.fn()
  }
}))

const mockCoursesService = coursesService as any

// Helper function to create mock course
const createMockCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-123',
  title: 'Test Course',
  description: 'Learn basic mathematical concepts',
  subject: 'Mathematics',
  level: 'Bachelor',
  isPublic: true,
  tags: ['math', 'basics'],
  createdBy: {
    id: 'user-123',
    email: 'instructor@example.com',
    displayName: 'Dr. Smith'
  },
  createdAt: new Date(),
  ...overrides
})

describe('useSearchCourses hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useSearchCourses())
      
      expect(result.current.courses).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.subjects).toEqual([])
      expect(typeof result.current.fetchCourses).toBe('function')
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should start loading when autoFetch is true', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses({ autoFetch: true }))
      
      expect(result.current.loading).toBe(true)
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.loading).toBe(false)
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledTimes(1)
    })

    it('should not auto-fetch when autoFetch is false', () => {
      const { result } = renderHook(() => useSearchCourses({ autoFetch: false }))
      
      expect(result.current.loading).toBe(true)
      expect(mockCoursesService.getAllCourses).not.toHaveBeenCalled()
    })
  })

  describe('course fetching', () => {
    it('should fetch courses with no filters', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses())
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.courses).toEqual(mockCourses)
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true
      })
    })

    it('should fetch courses with search term filter', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses({
        searchTerm: 'calculus'
      }))
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true,
        searchTerm: 'calculus'
      })
    })

    it('should fetch courses with subject filter', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses({
        selectedSubject: 'Physics'
      }))
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true,
        subject: 'Physics'
      })
    })

    it('should fetch courses with level filter using level mapping', async () => {
      const levelMappings = [
        { input: 'highschool', expected: 'High school' },
        { input: 'bachelor', expected: 'Bachelor' },
        { input: 'master', expected: 'Master' }
      ]
      
      for (const { input, expected } of levelMappings) {
        mockCoursesService.getAllCourses.mockClear()
        const mockCourses = [createMockCourse({ level: expected })]
        mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
        
        const { result } = renderHook(() => useSearchCourses({
          selectedLevel: input
        }))
        
        await act(async () => {
          await vi.runOnlyPendingTimersAsync()
        })
        
        expect(result.current.loading).toBe(false)
        expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
          isPublic: true,
          level: expected
        })
      }
    })

    it('should fetch courses with multiple filters combined', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses({
        searchTerm: 'calculus',
        selectedSubject: 'Mathematics',
        selectedLevel: 'bachelor'
      }))
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true,
        searchTerm: 'calculus',
        subject: 'Mathematics',
        level: 'Bachelor'
      })
    })

    it('should handle unknown level mappings by not setting level filter', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses({
        selectedLevel: 'unknown'
      }))
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true
      })
    })

    it('should handle empty string filters by not including them', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses({
        searchTerm: '',
        selectedSubject: '',
        selectedLevel: ''
      }))
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true
      })
    })

    it('should handle fetch errors gracefully', async () => {
      mockCoursesService.getAllCourses.mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useSearchCourses())
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.error).toBe('Network error')
      expect(result.current.loading).toBe(false)
      expect(result.current.courses).toEqual([])
    })

    it('should handle non-Error objects in fetch errors', async () => {
      mockCoursesService.getAllCourses.mockRejectedValue('String error')
      
      const { result } = renderHook(() => useSearchCourses())
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.error).toBe('Failed to load courses')
    })

    it('should clear error on successful refetch', async () => {
      const mockCourses = [createMockCourse()]
      
      // First call fails, second succeeds
      mockCoursesService.getAllCourses
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses())
      
      // Wait for initial error
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.error).toBe('Network error')
      
      // Manual refetch
      await act(async () => {
        await result.current.refetch()
      })
      
      expect(result.current.error).toBeNull()
      expect(result.current.courses).toEqual(mockCourses)
    })
  })

  describe('debouncing', () => {
    it('should debounce search requests with default delay', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { rerender } = renderHook(
        ({ searchTerm }) => useSearchCourses({ searchTerm }),
        { initialProps: { searchTerm: '' } }
      )
      
      // Rapidly change search term
      rerender({ searchTerm: 'a' })
      rerender({ searchTerm: 'ab' })
      rerender({ searchTerm: 'abc' })
      
      // Should not have called API yet
      expect(mockCoursesService.getAllCourses).not.toHaveBeenCalled()
      
      // Let timers and promises resolve
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      // Should call API only once with final search term
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledTimes(1)
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true,
        searchTerm: 'abc'
      })
    })

    it('should use custom debounce delay', async () => {
      mockCoursesService.getAllCourses.mockResolvedValue([])
      
      const { rerender } = renderHook(
        ({ searchTerm }) => useSearchCourses({ searchTerm, debounceMs: 500 }),
        { initialProps: { searchTerm: '' } }
      )
      
      rerender({ searchTerm: 'test' })
      
      // After 300ms (less than custom delay), shouldn't have called yet
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(mockCoursesService.getAllCourses).not.toHaveBeenCalled()
      
      // Complete the full debounce period
      await act(async () => {
        vi.advanceTimersByTime(200) // Additional 200ms = 500ms total
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous debounced calls when parameters change', async () => {
      mockCoursesService.getAllCourses.mockResolvedValue([])
      
      const { rerender } = renderHook(
        ({ searchTerm }) => useSearchCourses({ searchTerm }),
        { initialProps: { searchTerm: '' } }
      )
      
      // Change search term, then change it again before debounce expires
      rerender({ searchTerm: 'first' })
      
      await act(async () => {
        vi.advanceTimersByTime(200) // Wait 200ms
      })
      
      rerender({ searchTerm: 'second' })
      
      // Complete the debounce period
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      // Should only call once with the final term
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledTimes(1)
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true,
        searchTerm: 'second'
      })
    })

    it('should debounce all filter changes', async () => {
      mockCoursesService.getAllCourses.mockResolvedValue([])
      
      const { rerender } = renderHook(
        ({ searchTerm, selectedSubject }) => useSearchCourses({ searchTerm, selectedSubject }),
        { initialProps: { searchTerm: '', selectedSubject: '' } }
      )
      
      // Change both filters rapidly
      rerender({ searchTerm: 'test', selectedSubject: 'Math' })
      rerender({ searchTerm: 'test', selectedSubject: 'Physics' })
      
      // Complete debounce
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledTimes(1)
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true,
        searchTerm: 'test',
        subject: 'Physics'
      })
    })
  })

  describe('subjects extraction', () => {
    it('should extract unique subjects from courses', async () => {
      const mockCourses = [
        createMockCourse({ subject: 'Mathematics' }),
        createMockCourse({ subject: 'Physics' }),
        createMockCourse({ subject: 'Mathematics' }) // Duplicate
      ]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses())
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.subjects).toEqual(['Mathematics', 'Physics'])
    })

    it('should return empty subjects array when no courses', async () => {
      mockCoursesService.getAllCourses.mockResolvedValue([])
      
      const { result } = renderHook(() => useSearchCourses())
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.subjects).toEqual([])
    })

    it('should update subjects when courses change', async () => {
      const initialCourses = [
        createMockCourse({ subject: 'Mathematics' }),
        createMockCourse({ subject: 'Physics' })
      ]
      
      const updatedCourses = [
        createMockCourse({ subject: 'Chemistry' }),
        createMockCourse({ subject: 'Biology' })
      ]
      
      mockCoursesService.getAllCourses
        .mockResolvedValueOnce(initialCourses)
        .mockResolvedValueOnce(updatedCourses)
      
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useSearchCourses({ searchTerm }),
        { initialProps: { searchTerm: '' } }
      )
      
      // Initial load
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.subjects).toEqual(['Mathematics', 'Physics'])
      
      // Change search term to trigger new fetch
      rerender({ searchTerm: 'bio' })
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.subjects).toEqual(['Chemistry', 'Biology'])
    })
  })

  describe('manual fetching', () => {
    it('should allow manual fetch via fetchCourses function', async () => {
      const mockCourses = [createMockCourse()]
      mockCoursesService.getAllCourses.mockResolvedValue(mockCourses)
      
      const { result } = renderHook(() => useSearchCourses({ autoFetch: false }))
      
      // Initially no courses
      expect(result.current.courses).toEqual([])
      
      // Manual fetch
      await act(async () => {
        await result.current.fetchCourses()
      })
      
      expect(result.current.courses).toEqual(mockCourses)
    })

    it('should set loading state during manual fetch', async () => {
      const mockCourses = [createMockCourse()]
      let resolvePromise: (value: Course[]) => void
      const promise = new Promise<Course[]>((resolve) => {
        resolvePromise = resolve
      })
      mockCoursesService.getAllCourses.mockReturnValue(promise)
      
      const { result } = renderHook(() => useSearchCourses({ autoFetch: false }))
      
      // Start manual fetch
      act(() => {
        result.current.fetchCourses()
      })
      
      expect(result.current.loading).toBe(true)
      
      // Resolve the promise
      await act(async () => {
        resolvePromise(mockCourses)
        await promise
      })
      
      expect(result.current.loading).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('should handle rapid filter changes with different debounce times', async () => {
      mockCoursesService.getAllCourses.mockResolvedValue([])
      
      const { rerender } = renderHook(
        ({ debounceMs }) => useSearchCourses({ searchTerm: 'test', debounceMs }),
        { initialProps: { debounceMs: 100 } }
      )
      
      // Change debounce time
      rerender({ debounceMs: 500 })
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(mockCoursesService.getAllCourses).toHaveBeenCalledWith({
        isPublic: true,
        searchTerm: 'test'
      })
    })

    it('should maintain courses and subjects state during loading', async () => {
      const initialCourses = [createMockCourse({ subject: 'Math' })]
      
      mockCoursesService.getAllCourses.mockResolvedValue(initialCourses)
      
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useSearchCourses({ searchTerm }),
        { initialProps: { searchTerm: '' } }
      )
      
      // Initial load
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
      
      expect(result.current.courses).toEqual(initialCourses)
      expect(result.current.subjects).toEqual(['Math'])
      
      // Change search - courses/subjects should remain until new data loads
      rerender({ searchTerm: 'physics' })
      
      expect(result.current.courses).toEqual(initialCourses)
      expect(result.current.subjects).toEqual(['Math'])
      
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })
    })
  })
})