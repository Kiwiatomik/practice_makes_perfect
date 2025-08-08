import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Alert from 'react-bootstrap/Alert'
import { Link } from 'react-router'
import { Course, Lesson } from '../types'
import { coursesService } from '../services/coursesService'


function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourse = async () => {
    if (!id) {
      setError('Course ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const fetchedCourse = await coursesService.getCourseById(id)
      setCourse(fetchedCourse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourse()
  }, [id])

  const getLevelColor = (level: string) => {
    if (level === 'High school') return 'info'
    if (level === 'Bachelor') return 'primary'
    return 'dark'
  }

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'Easy') return 'success'
    if (difficulty === 'Medium') return 'warning'
    return 'danger'
  }



  const getCompletedCount = (lessons: Lesson[]) => {
    return lessons.filter(lesson => lesson.isCompleted).length
  }

  const getProgressPercentage = (lessons: Lesson[]) => {
    if (lessons.length === 0) return 0
    return (getCompletedCount(lessons) / lessons.length) * 100
  }

  if (loading) {
    return (
      <Container className="my-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading course...</span>
          </div>
          <p className="mt-2 text-muted">Loading course...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Course</Alert.Heading>
          <p>{error}</p>
          <div>
            <Button variant="outline-danger" onClick={fetchCourse} className="me-2">
              Try Again
            </Button>
            <Link to="/courses" className="btn btn-secondary">
              Back to All Courses
            </Link>
          </div>
        </Alert>
      </Container>
    )
  }

  if (!course) {
    return (
      <Container className="my-4">
        <div className="text-center">
          <h2>Course not found</h2>
          <p>The course you're looking for doesn't exist.</p>
          <Link to="/courses" className="btn btn-primary">
            Back to All Courses
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
              <h1 className="mb-0 me-3">{course.title}</h1>
              <Badge bg={getLevelColor(course.level)} className="me-2">
                {course.level}
              </Badge>
              <Badge bg="secondary">{course.subject}</Badge>
            </div>
            <p className="lead mb-3">{course.description}</p>
            
            <Row className="mb-4">
              <Col md={6}>
                <div className="d-flex align-items-center mb-2">
                  <strong className="me-2">Progress:</strong>
                  <span className="me-2">
                    {getCompletedCount(course.lessons)} of {course.lessons.length} lessons completed
                  </span>
                </div>
                <ProgressBar 
                  now={getProgressPercentage(course.lessons)} 
                  label={`${Math.round(getProgressPercentage(course.lessons))}%`}
                  className="mb-2"
                />
              </Col>
              <Col md={6}>
                <div className="text-md-end">
                  <div><strong>Created by:</strong> {course.createdBy.displayName}</div>
                  <div><strong>Updated:</strong> {course.updatedAt.toLocaleDateString()}</div>
                </div>
              </Col>
            </Row>

            <div className="mb-4">
              {course.tags.map(tag => (
                <Badge key={tag} bg="light" text="dark" className="me-1 mb-1">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          <h2 className="mb-4">Lessons</h2>
          
          <Row className="g-3">
            {course.lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson, index) => (
                <Col key={lesson.id} xs={12}>
                  <Card className={`h-100 ${lesson.isCompleted ? 'border-success' : ''}`}>
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={1} className="text-center">
                          <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                            lesson.isCompleted ? 'bg-success text-white' : 'bg-light'
                          }`} style={{ width: '40px', height: '40px' }}>
                            {lesson.isCompleted ? '✓' : index + 1}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center mb-1">
                            <Card.Title className="mb-0 me-2">
                              <Link 
                                to={`/lesson/${lesson.id}`} 
                                className="text-decoration-none text-reset"
                              >
                                {lesson.title}
                              </Link>
                            </Card.Title>
                            <Badge bg={getDifficultyColor(lesson.difficulty)} size="sm">
                              {lesson.difficulty}
                            </Badge>
                          </div>
                          <Card.Text className="text-muted mb-0">
                            {lesson.description}
                          </Card.Text>
                        </Col>
                        <Col md={5} className="text-end">
                          <Button
                            as={Link}
                            to={`/lesson/${lesson.id}`}
                            variant={lesson.isCompleted ? 'outline-success' : 'primary'}
                            size="sm"
                          >
                            {lesson.isCompleted ? 'Review' : 'Start'}
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
          </Row>
        </Col>
      </Row>
    </Container>
  )
}

export default CoursePage
