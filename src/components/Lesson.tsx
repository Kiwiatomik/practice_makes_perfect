import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import { Link } from 'react-router'
import { Lesson as LessonType, Prompt } from '../types'
import { coursesService } from '../services/coursesService'

function Lesson() {
  const { id } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<LessonType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [firstPrompt, setFirstPrompt] = useState<Prompt | null>(null)
  const [promptLoading, setPromptLoading] = useState(false)

  const fetchLesson = async () => {
    if (!id) {
      setError('Lesson ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const fetchedLesson = await coursesService.getLessonById(id)
      setLesson(fetchedLesson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  const fetchFirstPrompt = async () => {
    if (!lesson?.courseId || !id) return;
    
    try {
      setPromptLoading(true);
      const prompt = await coursesService.getFirstPromptByLessonId(lesson.courseId, id);
      setFirstPrompt(prompt);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      // Don't show error for prompts - just means no prompts exist
    } finally {
      setPromptLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson()
  }, [id])

  useEffect(() => {
    if (lesson?.courseId) {
      fetchFirstPrompt();
    }
  }, [lesson?.courseId, id])

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
            <Button variant="outline-danger" onClick={fetchLesson} className="me-2">
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

          <div className="mt-4 mb-5 d-flex gap-3">
            {firstPrompt && (
              <Button 
                variant="primary" 
                onClick={() => setShowQuestionModal(true)}
                disabled={promptLoading}
              >
                {promptLoading ? 'Loading...' : 'Question'}
              </Button>
            )}
          </div>

          <div className="mt-5 pt-4 border-top">
            <Link to={`/course/${lesson.courseId}`} className="text-decoration-none">
              ← Back to Course
            </Link>
          </div>
        </Col>
      </Row>

      {/* Question Modal */}
      <Modal 
        show={showQuestionModal} 
        onHide={() => setShowQuestionModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {firstPrompt?.text}
            </div>
          </div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Your Answer</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuestionModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              // For now, just close the modal
              // TODO: Add answer submission logic
              console.log('User answer:', userAnswer);
              setShowQuestionModal(false);
            }}
          >
            Submit Answer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Lesson
