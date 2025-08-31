import { useState, useEffect } from 'react'
import { Course } from '../types'
import { coursesService } from '../services/coursesService'

export function useGetCourse(courseId: string | undefined) {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourse = async () => {
    if (!courseId) {
      setError('Course ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const fetchedCourse = await coursesService.getCourseById(courseId)
      setCourse(fetchedCourse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  return {
    course,
    loading,
    error,
    refetch: fetchCourse
  }
}