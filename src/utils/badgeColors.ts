/**
 * Utility functions for determining Bootstrap badge colors
 * based on academic levels and difficulty ratings
 */

export const getLevelColor = (level: string): string => {
  if (level === 'High school') return 'info'
  if (level === 'Bachelor') return 'primary'
  return 'dark'
}

export const getDifficultyColor = (difficulty: string): string => {
  if (difficulty === 'Easy') return 'success'
  if (difficulty === 'Medium') return 'warning'
  return 'danger'
}