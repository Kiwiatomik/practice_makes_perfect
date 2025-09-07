import { useState, useEffect } from 'react'
import { Course } from '../types'
import { coursesService } from '../services/coursesService'

interface UseUserCoursesOptions {
  userId?: string
  autoFetch?: boolean
}

export function useUserCourses(options: UseUserCoursesOptions = {}) {
  const { userId, autoFetch = true } = options

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserCourses = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Fetch all courses and filter by user
      const allCourses = await coursesService.getAllCourses()
      const userCourses = allCourses.filter(course => course.createdBy.id === userId)
      
      setCourses(userCourses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && userId) {
      fetchUserCourses()
    }
  }, [userId, autoFetch])

  return {
    courses,
    loading,
    error,
    refetch: fetchUserCourses
  }
}