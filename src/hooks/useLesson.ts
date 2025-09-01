import { useState, useEffect } from 'react'
import { Lesson as LessonType, Prompt } from '../types'
import { coursesService } from '../services/coursesService'

export function useLesson(courseId: string | undefined, lessonId: string | undefined) {
  const [lesson, setLesson] = useState<LessonType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [firstPrompt, setFirstPrompt] = useState<Prompt | null>(null)
  const [promptLoading, setPromptLoading] = useState(false)

  const fetchLesson = async () => {
    if (!courseId || !lessonId) {
      setError('Course ID and Lesson ID are required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const fetchedLesson = await coursesService.getLessonById(courseId, lessonId)
      setLesson(fetchedLesson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  const fetchFirstPrompt = async () => {
    if (!courseId || !lessonId) return
    
    try {
      setPromptLoading(true)
      const prompt = await coursesService.getFirstPromptByLessonId(courseId, lessonId)
      setFirstPrompt(prompt)
    } catch (error) {
      console.error('Error fetching prompt:', error)
      // Don't show error for prompts - just means no prompts exist
    } finally {
      setPromptLoading(false)
    }
  }

  useEffect(() => {
    fetchLesson()
  }, [courseId, lessonId])

  useEffect(() => {
    if (courseId && lessonId) {
      fetchFirstPrompt()
    }
  }, [courseId, lessonId])

  return {
    lesson,
    loading,
    error,
    firstPrompt,
    promptLoading,
    refetch: fetchLesson
  }
}