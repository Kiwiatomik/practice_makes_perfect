import { useState, useEffect } from 'react'
import { Prompt, Working } from '../types'
import { aiService } from '../services/aiService'
import { coursesService } from '../services/coursesService'
import { useAuth } from '../contexts/AuthContext'

interface PromptState {
  id: string | null
  text: string
  workings: Working[] | null
  answer: string | null
  answerType: 'number' | 'equation' | null
  abstractionLevel: number
  isGeneratingQuestion: boolean
  questionGenerationError: string | null
  isLoadingSolution: boolean
  solutionError: string | null
  solution: string | null
  requiresAuth: boolean
}

export function usePrompt(initialPrompt: Prompt | null) {
  const { currentUser } = useAuth()
  const [promptState, setPromptState] = useState<PromptState>({
    id: null,
    text: '',
    workings: null,
    answer: null,
    answerType: null,
    abstractionLevel: 0,
    isGeneratingQuestion: false,
    questionGenerationError: null,
    isLoadingSolution: false,
    solutionError: null,
    solution: null,
    requiresAuth: false
  })

  // Initialize prompt state when initialPrompt changes
  useEffect(() => {
    if (initialPrompt?.text) {
      console.log('usePrompt - initialPrompt received:', {
        id: initialPrompt.id,
        answerType: initialPrompt.answerType,
        text: initialPrompt.text?.substring(0, 50) + '...'
      })
      
      setPromptState({
        id: initialPrompt.id,
        text: initialPrompt.text,
        workings: initialPrompt.workings || null,
        answer: initialPrompt.answer || null,
        answerType: initialPrompt.answerType || null,
        abstractionLevel: initialPrompt.abstractionLevel || 0,
        isGeneratingQuestion: false,
        questionGenerationError: null,
        isLoadingSolution: false,
        solutionError: null,
        solution: null,
        requiresAuth: false
      })
      
      console.log('usePrompt - prompt state set with answerType:', initialPrompt.answerType || null)
    }
  }, [initialPrompt?.text, initialPrompt?.workings, initialPrompt?.answer, initialPrompt?.id, initialPrompt?.abstractionLevel, initialPrompt?.answerType])

  const solveQuestionWithAI = async (courseId?: string, lessonId?: string) => {
    if (!promptState.text) return

    // Check if user is authenticated
    if (!currentUser) {
      console.log('User not authenticated, prompting for login')
      setPromptState(prev => ({ ...prev, requiresAuth: true }))
      return
    }

    // If we already have workings, use those
    if (promptState.workings) {
      console.log('Using existing workings (from database or practice question)')
      setPromptState(prev => ({ ...prev, solution: 'workings' }))
      return
    }

    // Check if this is the original question and we have database workings
    if (initialPrompt?.workings && promptState.text === initialPrompt.text) {
      console.log('Using database workings for original question:', initialPrompt.workings)
      setPromptState(prev => ({ 
        ...prev, 
        workings: initialPrompt.workings || null,
        solution: 'workings'
      }))
      return
    }

    // Only call API if no workings are available
    console.log('No workings available, calling API for solution')
    try {
      setPromptState(prev => ({ 
        ...prev, 
        isLoadingSolution: true, 
        solutionError: null 
      }))
      
      const solution = await aiService.solveQuestionWithAI(promptState.text, courseId, lessonId)
      console.log('Raw solution response from API:', solution)
      
      // Parse the JSON response to extract workings
      let jsonString = solution.trim()
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      try {
        const parsedSolution = JSON.parse(jsonString)
        console.log('Parsed API solution:', parsedSolution)
        
        if (parsedSolution.workings) {
          console.log('API generated workings:', parsedSolution.workings)
          console.log('API generated answer:', parsedSolution.answer)
          setPromptState(prev => ({
            ...prev,
            workings: parsedSolution.workings,
            answer: parsedSolution.answer || prev.answer,
            solution: 'workings'
          }))
        } else {
          console.log('No workings found in API response')
          if (parsedSolution.answer) {
            console.log('API generated answer (no workings):', parsedSolution.answer)
            setPromptState(prev => ({
              ...prev,
              answer: parsedSolution.answer,
              solution: solution
            }))
          } else {
            setPromptState(prev => ({ ...prev, solution: solution }))
          }
        }
      } catch (parseError) {
        console.error('Error parsing API solution response:', parseError)
        console.error('JSON string attempted to parse:', jsonString)
        setPromptState(prev => ({ ...prev, solution: solution }))
      }
    } catch (error) {
      console.error('Error calling AI API for solution:', error)
      setPromptState(prev => ({ 
        ...prev, 
        solutionError: error instanceof Error ? error.message : 'Failed to solve question'
      }))
    } finally {
      setPromptState(prev => ({ ...prev, isLoadingSolution: false }))
    }
  }

  const generateQuestion = async (type: 'practice' | 'nextLevel', courseId?: string, lessonId?: string) => {
    if (!promptState.text) return

    // Check if user is authenticated
    if (!currentUser) {
      console.log('User not authenticated, prompting for login')
      setPromptState(prev => ({ ...prev, requiresAuth: true }))
      return false
    }

    try {
      setPromptState(prev => ({ 
        ...prev, 
        isGeneratingQuestion: true, 
        questionGenerationError: null 
      }))
      
      console.log(`${type} question - promptText sent to AI:`, promptState.text)
      const response = type === 'practice' 
        ? await aiService.generatePracticeQuestion(promptState.text)
        : await aiService.generateNextLevelQuestion(promptState.text)
      console.log(`Raw ${type} response:`, response)
      
      // Extract JSON from response (remove markdown code blocks if present)
      let jsonString = response.trim()
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      try {
        const parsedResponse = JSON.parse(jsonString)
        console.log('Parsed response:', parsedResponse)
        
        // Get the question text based on type
        const questionText = type === 'practice' 
          ? parsedResponse.new_question 
          : parsedResponse.next_level_question;
          
        if (questionText) {
          // Calculate new abstraction level
          const newAbstractionLevel = type === 'practice' 
            ? promptState.abstractionLevel  // Keep same level for practice
            : promptState.abstractionLevel + 1  // Increment for next level
          
          // Save the new question to the database if courseId and lessonId provided
          let newPromptId = null
          if (courseId && lessonId) {
            try {
              // Create clean data object without undefined values
              const newPromptData: any = {
                text: questionText,
                abstractionLevel: newAbstractionLevel,
              }
              
              // Only add fields that have actual values
              if (parsedResponse.workings) newPromptData.workings = parsedResponse.workings
              if (parsedResponse.answer) newPromptData.answer = parsedResponse.answer
              if (initialPrompt?.level) newPromptData.level = initialPrompt.level
              if (initialPrompt?.difficulty) newPromptData.difficulty = initialPrompt.difficulty
              if (promptState.id) newPromptData.parentPromptId = promptState.id
              
              newPromptId = await coursesService.createPrompt(courseId, lessonId, newPromptData)
              console.log(`Saved ${type} question to database with ID:`, newPromptId)
            } catch (error) {
              console.warn(`Failed to save ${type} question to database:`, error)
              // Continue anyway - user can still use the question
            }
          }
          
          // Update prompt state with new question
          setPromptState({
            id: newPromptId,
            text: questionText,
            workings: parsedResponse.workings || null,
            answer: parsedResponse.answer || null,
            answerType: parsedResponse.answerType || initialPrompt?.answerType || null,
            abstractionLevel: newAbstractionLevel,
            // Reset AI operation states
            isGeneratingQuestion: false,
            questionGenerationError: null,
            isLoadingSolution: false,
            solutionError: null,
            solution: null
          })
          
          console.log(`${type} question workings:`, parsedResponse.workings)
          console.log(`${type} question answer:`, parsedResponse.answer)
          
          return true // Success
        } else {
          throw new Error(`No ${type === 'practice' ? 'new_question' : 'next_level_question'} found in response`)
        }
      } catch (parseError) {
        console.error(`Error parsing ${type} question response:`, parseError)
        console.error('JSON string attempted to parse:', jsonString)
        setPromptState(prev => ({ 
          ...prev, 
          questionGenerationError: `Failed to parse ${type} question response`
        }))
      }
    } catch (error) {
      console.error(`Error generating ${type} question:`, error)
      setPromptState(prev => ({ 
        ...prev, 
        questionGenerationError: error instanceof Error ? error.message : `Failed to generate ${type} question`
      }))
    } finally {
      setPromptState(prev => ({ ...prev, isGeneratingQuestion: false }))
    }
    
    return false // Failure
  }

  const resetToOriginal = () => {
    if (initialPrompt) {
      setPromptState({
        id: initialPrompt.id,
        text: initialPrompt.text,
        workings: initialPrompt.workings || null,
        answer: initialPrompt.answer || null,
        answerType: initialPrompt.answerType || null,
        abstractionLevel: initialPrompt.abstractionLevel || 0,
        isGeneratingQuestion: false,
        questionGenerationError: null,
        isLoadingSolution: false,
        solutionError: null,
        solution: null,
        requiresAuth: false
      })
    }
  }

  const clearAuthRequirement = () => {
    setPromptState(prev => ({ ...prev, requiresAuth: false }))
  }

  return {
    promptState,
    solveQuestionWithAI,
    generateQuestion,
    resetToOriginal,
    clearAuthRequirement
  }
}