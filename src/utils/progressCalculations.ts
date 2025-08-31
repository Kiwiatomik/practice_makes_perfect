import { Lesson } from '../types'

/**
 * Utility functions for calculating course progress
 * based on lesson completion status
 */

export const getCourseProgress = (lessons: Lesson[]) => {
  const completedCount = lessons.filter(lesson => lesson.isCompleted).length
  const totalCount = lessons.length
  const percentage = totalCount === 0 ? 0 : (completedCount / totalCount) * 100

  return {
    completedCount,
    totalCount,
    percentage
  }
}