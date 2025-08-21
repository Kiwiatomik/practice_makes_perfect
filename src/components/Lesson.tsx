import { useParams } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import { Link } from 'react-router'
import { useLesson } from '../hooks/useLesson'
import { usePrompt } from '../hooks/usePrompt'
import { useModal } from '../hooks/useModal'
import { useAuth } from '../contexts/AuthContext'
import { coursesService } from '../services/coursesService'
import QuestionModal from './QuestionModal'

function Lesson() {
  const { id } = useParams<{ id: string }>()
  
  // Custom hooks
  const { currentUser } = useAuth()
  const { lesson, loading, error, firstPrompt, promptLoading, refetch } = useLesson(id)
  const { promptState, solveQuestionWithAI, generateQuestion, resetToOriginal } = usePrompt(firstPrompt)
  const { modalState, showModal, hideModal, setUserAnswer, submitAnswer, resetForNewQuestion } = useModal()

  // Debug logging
  console.log('Lesson - firstPrompt:', firstPrompt)
  console.log('Lesson - promptState.answerType:', promptState.answerType)
  console.log('Lesson - passing to QuestionModal:', promptState.answerType || undefined)


  // Helper function for generating questions with modal state reset
  const handleGenerateQuestion = async (type: 'practice' | 'nextLevel') => {
    const success = await generateQuestion(type, lesson?.courseId, id)
    if (success) {
      resetForNewQuestion()
    }
  }

  // Handle modal close - just hide, don't reset data
  const handleModalClose = () => {
    hideModal()
    // Don't reset to original or clear modal data - preserve user's progress
  }

  // Handle starting fresh with the original question
  const handleStartFresh = () => {
    resetToOriginal()
    resetForNewQuestion()
    showModal()
  }

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    console.log('=== handleSubmitAnswer called ===')
    console.log('User:', currentUser?.uid)
    console.log('FirstPrompt:', firstPrompt?.id)
    console.log('Lesson courseId:', lesson?.courseId)
    console.log('Lesson id:', id)
    console.log('Modal state:', modalState)
    console.log('Prompt state:', promptState)
    
    submitAnswer(promptState.answer, promptState.answerType)
    
    // Record the answer in database
    if (currentUser && firstPrompt && lesson?.courseId && id) {
      console.log('All conditions met - attempting to record answer')
      try {
        const answerData = {
          abstractionLevel: promptState.abstractionLevel || firstPrompt.abstractionLevel || 0,
          userAnswer: modalState.userAnswer,
          correctAnswer: promptState.answer,
          isCorrect: modalState.isCorrect
        }
        console.log('Answer data to record:', answerData)
        
        const answerId = await coursesService.recordUserAnswer(
          currentUser.uid,
          lesson.courseId,
          id,
          firstPrompt.id,
          answerData
        )
        console.log('✅ Answer recorded successfully with ID:', answerId)
      } catch (error) {
        console.error('❌ Failed to record answer:', error)
        // Don't block user experience if recording fails
      }
    } else {
      console.log('❌ Cannot record answer - missing required data:')
      console.log('- User:', !!currentUser)
      console.log('- FirstPrompt:', !!firstPrompt)
      console.log('- Lesson courseId:', !!lesson?.courseId)
      console.log('- Lesson id:', !!id)
    }
    
    // Automatically load solution after submitting answer
    solveQuestionWithAI()
    console.log('User answer:', modalState.userAnswer)
    if (promptState.answer) {
      console.log('Correct answer:', promptState.answer)
      console.log('Answer comparison - User:', modalState.userAnswer, 'Correct:', promptState.answer)
    } else {
      console.log('No correct answer available for comparison')
    }
  }



  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'Easy') return 'success'
    if (difficulty === 'Medium') return 'warning'
    return 'danger'
  }

  if (loading) {
    return (
      <Container className="my-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading lesson...</span>
          </div>
          <p className="mt-2 text-muted">Loading lesson...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Lesson</Alert.Heading>
          <p>{error}</p>
          <div>
            <Button variant="outline-danger" onClick={refetch} className="me-2">
              Try Again
            </Button>
            {lesson?.courseId ? (
              <Link to={`/course/${lesson.courseId}`} className="btn btn-secondary">
                Back to Course
              </Link>
            ) : (
              <Link to="/courses" className="btn btn-secondary">
                Back to Courses
              </Link>
            )}
          </div>
        </Alert>
      </Container>
    )
  }

  if (!lesson) {
    return (
      <Container className="my-4">
        <div className="text-center">
          <h2>Lesson not found</h2>
          <p>The lesson you're looking for doesn't exist.</p>
          <Link to="/courses" className="btn btn-primary">
            Back to Courses
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <h1 className="mb-0 me-3">{lesson.title}</h1>
              <Badge bg={getDifficultyColor(lesson.difficulty)}>
                {lesson.difficulty}
              </Badge>
            </div>
          </div>

          <div className="lesson-content">
            <div className="mb-4">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {lesson.content}
              </div>
            </div>
          </div>

          <div className="mt-4 mb-2 d-flex gap-3">
            {firstPrompt && (
              <Button 
                variant="primary" 
                onClick={showModal}
                disabled={promptLoading}
              >
                {promptLoading ? 'Loading...' : 'Question'}
              </Button>
            )}
          </div>

          <div> 
            <Link to={`/course/${lesson.courseId}`} className="text-decoration-none">
              Back to Course
            </Link>
          </div>
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
        onGetSolution={solveQuestionWithAI}
        isGeneratingQuestion={promptState.isGeneratingQuestion}
        isLoadingSolution={promptState.isLoadingSolution}
        solutionError={promptState.solutionError}
        solution={promptState.solution}
        workings={promptState.workings}
      />
    </Container>
  )
}

export default Lesson
