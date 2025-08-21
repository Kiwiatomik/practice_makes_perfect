import { useState } from 'react'

interface ModalState {
  show: boolean
  hasSubmittedAnswer: boolean
  userAnswer: string
  isCorrect: boolean
}

// LaTeX command replacements for answer sanitization
const LATEX_REPLACEMENTS: Record<string, string> = {
  '<=': '\\leq',
  '>=': '\\geq',
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    show: false,
    hasSubmittedAnswer: false,
    userAnswer: '',
    isCorrect: false
  })

  const showModal = () => {
    setModalState(prev => ({ ...prev, show: true }))
  }

  const hideModal = () => {
    setModalState(prev => ({ ...prev, show: false }))
  }

  const setUserAnswer = (answer: string) => {
    setModalState(prev => ({ ...prev, userAnswer: answer }))
  }

  const sanitizeAnswer = (answer: string, isEquation: boolean = false): string => {
    let sanitized = answer.trim().toLowerCase()
    
    if (isEquation) {
      // Remove all spaces for equations
      sanitized = sanitized.replace(/\s+/g, '')
      
      // Apply LaTeX command replacements
      Object.entries(LATEX_REPLACEMENTS).forEach(([from, to]) => {
        sanitized = sanitized.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to)
      })
    }
    
    return sanitized
  }

  const submitAnswer = (correctAnswer?: string, answerType?: 'number' | 'equation') => {
    setModalState(prev => {
      const isEquation = answerType === 'equation'
      const sanitizedUserAnswer = sanitizeAnswer(prev.userAnswer, isEquation)
      const sanitizedCorrectAnswer = correctAnswer ? sanitizeAnswer(correctAnswer, isEquation) : ''
      
      return {
        ...prev, 
        hasSubmittedAnswer: true,
        isCorrect: correctAnswer ? sanitizedUserAnswer === sanitizedCorrectAnswer : false
      }
    })
  }

  const resetForNewQuestion = () => {
    setModalState(prev => ({
      ...prev,
      hasSubmittedAnswer: false,
      userAnswer: '',
      isCorrect: false
    }))
  }

  return {
    modalState,
    showModal,
    hideModal,
    setUserAnswer,
    submitAnswer,
    resetForNewQuestion
  }
}

export { LATEX_REPLACEMENTS }