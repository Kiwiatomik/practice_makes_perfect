import { describe, it, expect } from 'vitest'
import { getLevelColor, getDifficultyColor } from './badgeColors'

describe('badgeColors utilities', () => {
  describe('getLevelColor', () => {
    it('should return "info" for High school level', () => {
      expect(getLevelColor('High school')).toBe('info')
    })

    it('should return "primary" for Bachelor level', () => {
      expect(getLevelColor('Bachelor')).toBe('primary')
    })

    it('should return "dark" for Master level', () => {
      expect(getLevelColor('Master')).toBe('dark')
    })

    it('should return "dark" for unknown levels', () => {
      expect(getLevelColor('PhD')).toBe('dark')
      expect(getLevelColor('Graduate')).toBe('dark')
      expect(getLevelColor('')).toBe('dark')
    })

    it('should handle case sensitivity', () => {
      expect(getLevelColor('high school')).toBe('dark') // case sensitive
      expect(getLevelColor('BACHELOR')).toBe('dark') // case sensitive
      expect(getLevelColor('bachelor')).toBe('dark') // case sensitive
    })
  })

  describe('getDifficultyColor', () => {
    it('should return "success" for Easy difficulty', () => {
      expect(getDifficultyColor('Easy')).toBe('success')
    })

    it('should return "warning" for Medium difficulty', () => {
      expect(getDifficultyColor('Medium')).toBe('warning')
    })

    it('should return "danger" for Hard difficulty', () => {
      expect(getDifficultyColor('Hard')).toBe('danger')
    })

    it('should return "danger" for unknown difficulties', () => {
      expect(getDifficultyColor('Extreme')).toBe('danger')
      expect(getDifficultyColor('Beginner')).toBe('danger')
      expect(getDifficultyColor('')).toBe('danger')
    })

    it('should handle case sensitivity', () => {
      expect(getDifficultyColor('easy')).toBe('danger') // case sensitive
      expect(getDifficultyColor('MEDIUM')).toBe('danger') // case sensitive
      expect(getDifficultyColor('hard')).toBe('danger') // case sensitive
    })
  })

  describe('integration scenarios', () => {
    it('should provide consistent color mapping across different course levels', () => {
      const levels = ['High school', 'Bachelor', 'Master']
      const expectedColors = ['info', 'primary', 'dark']
      
      levels.forEach((level, index) => {
        expect(getLevelColor(level)).toBe(expectedColors[index])
      })
    })

    it('should provide consistent color mapping across different difficulties', () => {
      const difficulties = ['Easy', 'Medium', 'Hard']
      const expectedColors = ['success', 'warning', 'danger']
      
      difficulties.forEach((difficulty, index) => {
        expect(getDifficultyColor(difficulty)).toBe(expectedColors[index])
      })
    })
  })
})