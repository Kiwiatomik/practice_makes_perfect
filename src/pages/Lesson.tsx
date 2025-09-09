import { useParams } from 'react-router'
import { useCallback, useState, useEffect } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import { Link } from 'react-router'
import { useLesson } from '../hooks/useLesson'
import { usePrompt } from '../hooks/usePrompt'
import { useModal } from '../hooks/useModal'
import { useAuth } from '../contexts/AuthContext'
import { coursesService } from '../services/coursesService'
import QuestionModal from '../components/QuestionModal'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'
import LoadingState from '../components/shared/LoadingState'
import ErrorState from '../components/shared/ErrorState'
import { useModalBlurEffect } from '../hooks/useModalBlurEffect'
import { getDifficultyColor } from '../utils/badgeColors'
import { sanitizeLessonError } from '../utils/errorSanitization'

function Lesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  
  // Custom hooks
  const { currentUser } = useAuth()
  const { lesson, loading, error, firstPrompt, promptLoading, refetch } = useLesson(courseId, lessonId)
  const { promptState, solveQuestionWithAI, generateQuestion, resetToOriginal, clearAuthRequirement } = usePrompt(firstPrompt)
  const { modalState, showModal, hideModal, setUserAnswer, submitAnswer, resetForNewQuestion } = useModal()
  
  // Auth modal state
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  
  // Apply blur effect when auth modals are shown
  useModalBlurEffect({ show: showLoginModal || showRegisterModal })
  
  // Watch for authentication requirement
  useEffect(() => {
    if (promptState.requiresAuth && !currentUser) {
      setShowLoginModal(true)
    }
  }, [promptState.requiresAuth, currentUser])
  
  // Clear auth requirement when user logs in
  useEffect(() => {
    if (currentUser && promptState.requiresAuth) {
      clearAuthRequirement()
      setShowLoginModal(false)
      setShowRegisterModal(false)
    }
  }, [currentUser, promptState.requiresAuth, clearAuthRequirement])

  // Auth modal handlers
  const handleLoginModalClose = useCallback(() => {
    setShowLoginModal(false)
    clearAuthRequirement()
  }, [clearAuthRequirement])
  
  const handleRegisterModalClose = useCallback(() => {
    setShowRegisterModal(false)
    clearAuthRequirement()
  }, [clearAuthRequirement])
  
  const handleSwitchToRegister = useCallback(() => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }, [])
  
  const handleSwitchToLogin = useCallback(() => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }, [])

  // Helper function for generating questions with modal state reset
  const handleGenerateQuestion = useCallback(async (type: 'practice' | 'nextLevel') => {
    const success = await generateQuestion(type, courseId, lessonId)
    if (success) {
      resetForNewQuestion()
    }
  }, [generateQuestion, courseId, lessonId, resetForNewQuestion])

  // Handle modal close - just hide, don't reset data
  const handleModalClose = useCallback(() => {
    hideModal()
    // Don't reset to original or clear modal data - preserve user's progress
  }, [hideModal])

  // Handle starting fresh with the original question
  const handleStartFresh = useCallback(() => {
    resetToOriginal()
    resetForNewQuestion()
    showModal()
  }, [resetToOriginal, resetForNewQuestion, showModal])

  // Handle get solution with courseId and lessonId
  const handleGetSolution = useCallback(() => {
    solveQuestionWithAI(courseId, lessonId)
  }, [solveQuestionWithAI, courseId, lessonId])

  // Handle answer submission
  const handleSubmitAnswer = useCallback(async () => {
    submitAnswer(promptState.answer, promptState.answerType)
    
    // Record the answer in database
    if (currentUser && firstPrompt && courseId && lessonId) {
      try {
        const answerData = {
          abstractionLevel: promptState.abstractionLevel || firstPrompt.abstractionLevel || 0,
          userAnswer: modalState.userAnswer,
          correctAnswer: promptState.answer,
          isCorrect: modalState.isCorrect
        }
        
        await coursesService.recordUserAnswer(
          currentUser.uid,
          courseId,
          lessonId,
          firstPrompt.id,
          answerData
        )
      } catch (error) {
        console.error('Failed to record answer:', error)
        // Don't block user experience if recording fails
      }
    }
    
    // Automatically load solution after submitting answer
    solveQuestionWithAI(courseId, lessonId)
  }, [submitAnswer, promptState.answer, promptState.answerType, promptState.abstractionLevel, currentUser, firstPrompt, courseId, lessonId, modalState.userAnswer, modalState.isCorrect, solveQuestionWithAI])




  if (loading) {
    return <LoadingState message="Loading lesson..." />
  }

  if (error) {
    return (
      <ErrorState 
        title="Error Loading Lesson" 
        message={sanitizeLessonError(error)} 
        onRetry={refetch} 
        backLink={courseId ? `/course/${courseId}` : '/courses'} 
        backText={courseId ? 'Back to Course' : 'Back to Courses'} 
      />
    )
  }

  if (!lesson) {
    return (
      <ErrorState 
        title="Lesson not found" 
        message="The lesson you're looking for doesn't exist." 
        backLink="/courses" 
        backText="Back to Courses" 
      />
    )
  }

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <header className="mb-4">
            <h1 className="mb-3" id="lesson-title">{lesson.title}</h1>
          </header>

          <main className="lesson-content">
            <section className="mb-4" aria-labelledby="lesson-title">
              <div 
                style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                id="lesson-content"
                role="article"
              >
                {lesson.content}
              </div>
            </section>
          </main>

          <div className="mt-4 mb-2 d-flex gap-3" role="toolbar" aria-label="Lesson actions">
            {firstPrompt && (
              <Button 
                variant="primary" 
                onClick={showModal}
                disabled={promptLoading}
                aria-label={`Open question for ${lesson.title}`}
                aria-describedby="lesson-content"
              >
                {promptLoading ? 'Loading...' : 'Question'}
              </Button>
            )}
          </div>

          <Link 
            to={`/course/${courseId}`} 
            className="primary-link"
            aria-label="Return to course page"
          >
            Back to Course
          </Link>
        </Col>
      </Row>

      {/* Question Modal */}
      <QuestionModal
        show={modalState.show}
        onHide={handleModalClose}
        questionText={promptState.text}
        answerType={promptState.answerType || undefined}
        questionGenerationError={promptState.questionGenerationError}
        userAnswer={modalState.userAnswer}
        hasSubmittedAnswer={modalState.hasSubmittedAnswer}
        isCorrect={modalState.isCorrect}
        onAnswerChange={setUserAnswer}
        onSubmitAnswer={handleSubmitAnswer}
        onGenerateQuestion={handleGenerateQuestion}
        onGetSolution={handleGetSolution}
        isGeneratingQuestion={promptState.isGeneratingQuestion}
        isLoadingSolution={promptState.isLoadingSolution}
        solutionError={promptState.solutionError}
        solution={promptState.solution}
        workings={promptState.workings}
        aria-labelledby="lesson-title"
      />

      {/* Authentication Modals */}
      <LoginModal
        show={showLoginModal}
        onHide={handleLoginModalClose}
        onSwitchToRegister={handleSwitchToRegister}
      />
      
      <RegisterModal
        show={showRegisterModal}
        onHide={handleRegisterModalClose}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </Container>
  )
}

export default Lesson
