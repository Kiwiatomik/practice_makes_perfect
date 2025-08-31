import { useState, useEffect, useMemo } from 'react'
import { Course } from '../types'
import { coursesService, CourseFilters } from '../services/coursesService'

interface UseSearchCoursesOptions {
  searchTerm?: string
  selectedSubject?: string
  selectedLevel?: string
  autoFetch?: boolean
  debounceMs?: number
}

export function useSearchCourses(options: UseSearchCoursesOptions = {}) {
  const {
    searchTerm = '',
    selectedSubject = '',
    selectedLevel = '',
    autoFetch = true,
    debounceMs = 300
  } = options

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: CourseFilters = {
        isPublic: true
      }
      
      if (selectedSubject) {
        filters.subject = selectedSubject
      }
      
      if (selectedLevel) {
        const levelMap: Record<string, string> = {
          'highschool': 'High school',
          'bachelor': 'Bachelor',
          'master': 'Master'
        }
        filters.level = levelMap[selectedLevel]
      }
      
      if (searchTerm) {
        filters.searchTerm = searchTerm
      }
      
      const fetchedCourses = await coursesService.getAllCourses(filters)
      setCourses(fetchedCourses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!autoFetch) return

    const delayedSearch = setTimeout(() => {
      fetchCourses()
    }, debounceMs)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, selectedSubject, selectedLevel, autoFetch, debounceMs])

  const subjects = useMemo(() => 
    [...new Set(courses.map(course => course.subject))], 
    [courses]
  )

  return {
    courses,
    loading,
    error,
    subjects,
    fetchCourses,
    refetch: fetchCourses
  }
}