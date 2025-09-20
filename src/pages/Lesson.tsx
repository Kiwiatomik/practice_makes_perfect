import { useParams } from 'react-router'
import { useCallback, useState, useEffect } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
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
import ErrorBoundary from '../components/ErrorBoundary'
import { useModalBlurEffect } from '../hooks/useModalBlurEffect'
import { sanitizeLessonError } from '../utils/errorSanitization'
import analyticsService from '../services/analyticsService'
import performanceService from '../services/performanceService'
import loggingService from '../services/loggingService'

function Lesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()

  // Performance tracking
  const [, setPageLoadTrace] = useState<any>(null)
  
  // Custom hooks
  const { currentUser } = useAuth()
  const { lesson, loading, error, firstPrompt, promptLoading, refetch } = useLesson(courseId, lessonId)
  const { promptState, solveQuestionWithAI, generateQuestion, clearAuthRequirement } = usePrompt(firstPrompt)
  const { modalState, showModal, hideModal, setUserAnswer, submitAnswer, resetForNewQuestion } = useModal()
  
  // Auth modal state
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  
  // Apply blur effect when auth modals are shown
  useModalBlurEffect({ show: showLoginModal || showRegisterModal })

  // Performance tracking - page load
  useEffect(() => {
    const trace = performanceService.measurePageLoad('lesson')
    setPageLoadTrace(trace)

    // Analytics tracking
    if (courseId && lessonId && lesson?.title) {
      analyticsService.trackLessonStart(courseId, lessonId, lesson.title)
      loggingService.lessonEvent('lesson_page_loaded', lessonId, {
        courseId,
        lessonTitle: lesson.title
      })
    }

    return () => {
      if (trace) {
        performanceService.stopTrace(trace)
      }
    }
  }, [courseId, lessonId, lesson?.title])

  // Track lesson completion time
  useEffect(() => {
    if (!lesson || loading) return

    const startTime = Date.now()

    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      if (timeSpent > 10) { // Only track if spent more than 10 seconds
        analyticsService.trackLessonComplete(courseId!, lessonId!, timeSpent)
        loggingService.performanceEvent('lesson_completion_time', { timeSpent }, {
          courseId,
          lessonId
        })
      }
    }
  }, [lesson, loading, courseId, lessonId])
  
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
    const trace = performanceService.measureAIOperation('generate_question')
    const questionType = type === 'practice' ? 'practice_again' : 'next_level'

    try {
      loggingService.aiEvent(`generating ${questionType} question`, {
        courseId,
        lessonId,
        type: questionType
      })

      const success = await generateQuestion(type, courseId, lessonId)

      if (success) {
        resetForNewQuestion()
        analyticsService.trackQuestionGeneration(lessonId!, questionType, true)
        loggingService.aiEvent(`successfully generated ${questionType} question`, {
          courseId,
          lessonId
        })
      } else {
        analyticsService.trackQuestionGeneration(lessonId!, questionType, false)
        loggingService.error(`failed to generate ${questionType} question`, undefined, {
          courseId,
          lessonId,
          errorType: 'question_generation_failed'
        })
      }
    } catch (error) {
      analyticsService.trackQuestionGeneration(lessonId!, questionType, false)
      loggingService.error(`error generating ${questionType} question`, error as Error, {
        courseId,
        lessonId,
        errorType: 'question_generation_error'
      })
    } finally {
      if (trace) {
        performanceService.stopTrace(trace)
      }
    }
  }, [generateQuestion, courseId, lessonId, resetForNewQuestion])

  // Handle modal close - just hide, don't reset data
  const handleModalClose = useCallback(() => {
    hideModal()
    // Don't reset to original or clear modal data - preserve user's progress
  }, [hideModal])

  // Handle starting fresh with the original question


  // Handle answer submission
  const handleSubmitAnswer = useCallback(async () => {
    const trace = performanceService.measureApiCall('submit_answer')

    try {
      submitAnswer(promptState.answer || undefined, promptState.answerType || undefined)

      // Track answer submission
      if (lessonId && firstPrompt?.id) {
        analyticsService.trackAnswerSubmission(lessonId, firstPrompt.id, modalState.isCorrect)
        loggingService.userAction('answer_submitted', {
          lessonId,
          questionId: firstPrompt.id,
          isCorrect: modalState.isCorrect,
          userAnswer: modalState.userAnswer
        })
      }

      // Record the answer in database
      if (currentUser && firstPrompt && courseId && lessonId) {
        const dbTrace = performanceService.measureDatabaseOperation('write')
        try {
          const answerData = {
            abstractionLevel: promptState.abstractionLevel || firstPrompt.abstractionLevel || 0,
            userAnswer: modalState.userAnswer,
            correctAnswer: promptState.answer || undefined,
            isCorrect: modalState.isCorrect
          }

          await coursesService.recordUserAnswer(
            currentUser.uid,
            courseId,
            lessonId,
            firstPrompt.id,
            answerData
          )

          loggingService.info('answer recorded successfully', {
            courseId,
            lessonId,
            questionId: firstPrompt.id
          })
        } catch (error) {
          loggingService.error('failed to record answer', error as Error, {
            courseId,
            lessonId,
            questionId: firstPrompt?.id,
            errorType: 'database_write_error'
          })
        } finally {
          if (dbTrace) {
            performanceService.stopTrace(dbTrace)
          }
        }
      }

      // Automatically load solution after submitting answer
      const aiTrace = performanceService.measureAIOperation('generate_solution')
      try {
        await solveQuestionWithAI(courseId, lessonId)
        loggingService.aiEvent('solution generated successfully', { courseId, lessonId })
      } catch (error) {
        loggingService.error('failed to generate solution', error as Error, {
          courseId,
          lessonId,
          errorType: 'solution_generation_error'
        })
      } finally {
        if (aiTrace) {
          performanceService.stopTrace(aiTrace)
        }
      }
    } finally {
      if (trace) {
        performanceService.stopTrace(trace)
      }
    }
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
      <ErrorBoundary>
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
          isGeneratingQuestion={promptState.isGeneratingQuestion}
          isLoadingSolution={promptState.isLoadingSolution}
          solutionError={promptState.solutionError}
          solution={promptState.solution}
          workings={promptState.workings}
          aria-labelledby="lesson-title"
        />
      </ErrorBoundary>

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
