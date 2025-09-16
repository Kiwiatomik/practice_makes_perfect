import { describe, it, expect } from 'vitest'
import { getCourseProgress } from './progressCalculations'
import { Lesson } from '../types'

// Helper function to create mock lessons
const createMockLesson = (id: string, isCompleted: boolean = false): Lesson => ({
  id,
  content: `Content for lesson ${id}`,
  createdBy: { 
    id: 'user1', 
    email: 'test@example.com', 
    displayName: 'Test User',
    createdAt: new Date(),
    lastActive: new Date()
  },
  description: `Description for lesson ${id}`,
  difficulty: 'Medium' as const,
  duration: 30,
  isCompleted,
  order: parseInt(id),
  title: `Lesson ${id}`,
})

describe('progressCalculations utilities', () => {
  describe('getCourseProgress', () => {
    it('should return zero progress for empty lesson array', () => {
      const progress = getCourseProgress([])
      
      expect(progress.completedCount).toBe(0)
      expect(progress.totalCount).toBe(0)
      expect(progress.percentage).toBe(0)
    })

    it('should calculate progress for lessons with no completions', () => {
      const lessons = [
        createMockLesson('1', false),
        createMockLesson('2', false),
        createMockLesson('3', false),
      ]
      
      const progress = getCourseProgress(lessons)
      
      expect(progress.completedCount).toBe(0)
      expect(progress.totalCount).toBe(3)
      expect(progress.percentage).toBe(0)
    })

    it('should calculate progress for lessons with all completions', () => {
      const lessons = [
        createMockLesson('1', true),
        createMockLesson('2', true),
        createMockLesson('3', true),
      ]
      
      const progress = getCourseProgress(lessons)
      
      expect(progress.completedCount).toBe(3)
      expect(progress.totalCount).toBe(3)
      expect(progress.percentage).toBe(100)
    })

    it('should calculate progress for lessons with partial completions', () => {
      const lessons = [
        createMockLesson('1', true),
        createMockLesson('2', false),
        createMockLesson('3', true),
        createMockLesson('4', false),
      ]
      
      const progress = getCourseProgress(lessons)
      
      expect(progress.completedCount).toBe(2)
      expect(progress.totalCount).toBe(4)
      expect(progress.percentage).toBe(50)
    })

    it('should handle single lesson scenarios', () => {
      const completedLesson = [createMockLesson('1', true)]
      const incompleteLesson = [createMockLesson('1', false)]
      
      const completedProgress = getCourseProgress(completedLesson)
      expect(completedProgress.completedCount).toBe(1)
      expect(completedProgress.totalCount).toBe(1)
      expect(completedProgress.percentage).toBe(100)
      
      const incompleteProgress = getCourseProgress(incompleteLesson)
      expect(incompleteProgress.completedCount).toBe(0)
      expect(incompleteProgress.totalCount).toBe(1)
      expect(incompleteProgress.percentage).toBe(0)
    })

    it('should calculate percentage with proper rounding', () => {
      const lessons = [
        createMockLesson('1', true),
        createMockLesson('2', false),
        createMockLesson('3', false),
      ]
      
      const progress = getCourseProgress(lessons)
      
      expect(progress.completedCount).toBe(1)
      expect(progress.totalCount).toBe(3)
      expect(progress.percentage).toBeCloseTo(33.333333333333336) // 1/3 * 100
    })

    it('should handle lessons without isCompleted property', () => {
      const lessonsWithUndefined = [
        { ...createMockLesson('1'), isCompleted: undefined },
        createMockLesson('2', true),
        { ...createMockLesson('3'), isCompleted: undefined },
      ]
      
      const progress = getCourseProgress(lessonsWithUndefined)
      
      // undefined should be treated as false by filter
      expect(progress.completedCount).toBe(1)
      expect(progress.totalCount).toBe(3)
      expect(progress.percentage).toBeCloseTo(33.333333333333336)
    })

    it('should maintain immutability of input array', () => {
      const originalLessons = [
        createMockLesson('1', true),
        createMockLesson('2', false),
      ]
      const lessonsCopy = [...originalLessons]
      
      getCourseProgress(originalLessons)
      
      expect(originalLessons).toEqual(lessonsCopy)
      expect(originalLessons[0].isCompleted).toBe(true)
      expect(originalLessons[1].isCompleted).toBe(false)
    })

    describe('edge cases', () => {
      it('should handle very large lesson arrays', () => {
        const largeLessonArray = Array.from({ length: 1000 }, (_, index) => 
          createMockLesson(index.toString(), index % 2 === 0)
        )
        
        const progress = getCourseProgress(largeLessonArray)
        
        expect(progress.totalCount).toBe(1000)
        expect(progress.completedCount).toBe(500) // Every other lesson completed
        expect(progress.percentage).toBe(50)
      })

      it('should return consistent object structure', () => {
        const progress = getCourseProgress([])
        
        expect(progress).toHaveProperty('completedCount')
        expect(progress).toHaveProperty('totalCount')
        expect(progress).toHaveProperty('percentage')
        expect(Object.keys(progress)).toHaveLength(3)
      })
    })
  })
})