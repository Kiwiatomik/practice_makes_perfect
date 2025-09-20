import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { useAuth } from '../contexts/AuthContext'
import { coursesService } from '../services/coursesService'
import { useGetCourse } from '../hooks/useGetCourse'
import LoadingState from '../components/shared/LoadingState'
import ErrorState from '../components/shared/ErrorState'

function CreateLesson() {
  const { courseId } = useParams<{ courseId: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { course, loading: courseLoading, error: courseError } = useGetCourse(courseId)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    duration: 30,
    order: 1
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Set default order based on existing lessons
  useEffect(() => {
    if ((course as any)?.lessons) {
      const maxOrder = (course as any).lessons.length > 0 
        ? Math.max(...(course as any).lessons.map((lesson: any) => lesson.order))
        : 0
      setFormData(prev => ({
        ...prev,
        order: maxOrder + 1
      }))
    }
  }, [course])

  // Debug logging for authorization check
  console.log('CreateLesson Debug - Current User:', currentUser)
  console.log('CreateLesson Debug - Current User UID:', currentUser?.uid)
  console.log('CreateLesson Debug - Course:', course)
  console.log('CreateLesson Debug - Course createdBy:', course?.createdBy)
  console.log('CreateLesson Debug - Course createdBy UID:', course?.createdBy?.id)
  console.log('CreateLesson Debug - Is creator?:', course?.createdBy?.id === currentUser?.uid)
  
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) {
      setError('You must be logged in to create a lesson')
      return
    }
    
    if (!courseId) {
      setError('Course ID is required')
      return
    }
    
    if (!course) {
      setError('Course not found')
      return
    }
    
    // Check if user is the course creator
    if (course.createdBy.id !== currentUser.uid) {
      setError('Only the course creator can add lessons')
      return
    }
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please fill in all required fields')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const lessonData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        difficulty: formData.difficulty,
        duration: formData.duration,
        order: formData.order,
        isCompleted: false,
        createdBy: {
          id: currentUser.uid,
          displayName: currentUser.displayName || 'Anonymous',
          email: currentUser.email || '',
          createdAt: new Date(),
          lastActive: new Date()
        }
      }
      
      await coursesService.createLesson(courseId, lessonData)
      setSuccess(true)
      
      // Redirect after success
      setTimeout(() => {
        navigate(`/course/${courseId}`)
      }, 2000)
      
    } catch (error) {
      console.error('Failed to create lesson:', error)
      setError(error instanceof Error ? error.message : 'Failed to create lesson')
    } finally {
      setLoading(false)
    }
  }
  
  if (courseLoading) {
    return <LoadingState message="Loading course..." />
  }
  
  if (courseError || !course) {
    return (
      <ErrorState 
        title="Course not found" 
        message="The course you're looking for doesn't exist." 
        backLink="/courses" 
        backText="Back to Courses" 
      />
    )
  }
  
  // Check if user is authorized to add lessons
  if (!currentUser || course.createdBy.id !== currentUser.uid) {
    return (
      <ErrorState 
        title="Access Denied" 
        message="Only the course creator can add lessons to this course." 
        backLink={`/course/${courseId}`} 
        backText="Back to Course" 
      />
    )
  }
  
  return (
    <Container className="my-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <h2 className="mb-0">Add Lesson to "{course.title}"</h2>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success">
                  Lesson created successfully! Redirecting to course page...
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                {/* Title */}
                <Form.Group className="mb-3">
                  <Form.Label>Lesson Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter lesson title"
                    required
                  />
                </Form.Group>
                
                {/* Description */}
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the lesson"
                  />
                </Form.Group>
                
                {/* Content */}
                <Form.Group className="mb-3">
                  <Form.Label>Lesson Content *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Enter the lesson content. You can use plain text or basic formatting."
                    required
                  />
                  <Form.Text className="text-muted">
                    This will be displayed to students when they view the lesson.
                  </Form.Text>
                </Form.Group>
                
                {/* Difficulty and Duration Row */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Difficulty</Form.Label>
                      <Form.Select 
                        value={formData.difficulty}
                        onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        min="5"
                        max="300"
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 30)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Order */}
                <Form.Group className="mb-4">
                  <Form.Label>Lesson Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                  />
                  <Form.Text className="text-muted">
                    Position of this lesson within the course (1 = first lesson)
                  </Form.Text>
                </Form.Group>
                
                {/* Submit Button */}
                <div className="d-flex gap-2">
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      'Add Lesson'
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/course/${courseId}`)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CreateLesson