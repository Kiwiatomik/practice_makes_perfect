import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import ProgressBar from 'react-bootstrap/ProgressBar'
import { Link } from 'react-router'
import { Course, Lesson } from '../types'

// Mock data - in real app, this would come from API
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Calculus',
    description: 'Learn the fundamentals of differential calculus with step-by-step explanations and practice problems.',
    createdBy: {
      id: 'user1',
      email: 'john@example.com',
      displayName: 'John Smith',
      createdAt: new Date('2024-01-15'),
      lastActive: new Date('2024-07-30')
    },
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-07-20'),
    level: 'Bachelor',
    subject: 'Mathematics',
    tags: ['calculus', 'derivatives', 'mathematics'],
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'What is Calculus?',
        description: 'Introduction to the concept of calculus and its applications',
        content: 'Calculus is the mathematical study of continuous change...',
        order: 1,
        duration: 15,
        difficulty: 'Easy',
        isCompleted: false
      },
      {
        id: 'lesson-1-2',
        title: 'Limits and Continuity',
        description: 'Understanding limits and continuous functions',
        content: 'A limit describes the behavior of a function as it approaches a point...',
        order: 2,
        duration: 25,
        difficulty: 'Medium',
        isCompleted: false
      },
      {
        id: 'lesson-1-3',
        title: 'Introduction to Derivatives',
        description: 'Basic concepts of derivatives and differentiation',
        content: 'A derivative represents the rate of change of a function...',
        order: 3,
        duration: 30,
        difficulty: 'Medium',
        isCompleted: false
      },
      {
        id: 'lesson-1-4',
        title: 'Derivative Rules',
        description: 'Power rule, product rule, and chain rule',
        content: 'There are several rules that make finding derivatives easier...',
        order: 4,
        duration: 35,
        difficulty: 'Hard',
        isCompleted: false
      }
    ],
    isPublic: true
  },
  {
    id: '2',
    title: 'Linear Algebra Basics',
    description: 'Master vectors, matrices, and linear transformations through interactive problems.',
    createdBy: {
      id: 'user2',
      email: 'sarah@example.com',
      displayName: 'Sarah Johnson',
      createdAt: new Date('2024-02-10'),
      lastActive: new Date('2024-07-28')
    },
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-07-15'),
    level: 'Master',
    subject: 'Mathematics',
    tags: ['linear-algebra', 'vectors', 'matrices'],
    lessons: [
      {
        id: 'lesson-2-1',
        title: 'Introduction to Vectors',
        description: 'Understanding vectors and vector operations',
        content: 'Vectors are mathematical objects that have both magnitude and direction...',
        order: 1,
        duration: 20,
        difficulty: 'Easy',
        isCompleted: false
      },
      {
        id: 'lesson-2-2',
        title: 'Matrix Operations',
        description: 'Addition, multiplication, and properties of matrices',
        content: 'Matrices are rectangular arrays of numbers...',
        order: 2,
        duration: 40,
        difficulty: 'Medium',
        isCompleted: false
      },
      {
        id: 'lesson-2-3',
        title: 'Linear Transformations',
        description: 'Understanding how matrices transform vectors',
        content: 'A linear transformation is a function between vector spaces...',
        order: 3,
        duration: 45,
        difficulty: 'Hard',
        isCompleted: false
      }
    ],
    isPublic: true
  },
  {
    id: '3',
    title: 'Python Programming Fundamentals',
    description: 'Build a strong foundation in Python programming with hands-on coding exercises.',
    createdBy: {
      id: 'user3',
      email: 'mike@example.com',
      displayName: 'Mike Chen',
      createdAt: new Date('2024-03-05'),
      lastActive: new Date('2024-07-31')
    },
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-25'),
    level: 'High school',
    subject: 'Programming',
    tags: ['python', 'programming', 'basics'],
    lessons: [
      {
        id: 'lesson-3-1',
        title: 'Python Basics',
        description: 'Variables, data types, and basic syntax',
        content: 'Python is a high-level programming language...',
        order: 1,
        duration: 20,
        difficulty: 'Easy',
        isCompleted: false
      },
      {
        id: 'lesson-3-2',
        title: 'Control Structures',
        description: 'If statements, loops, and conditional logic',
        content: 'Control structures allow you to control the flow of your program...',
        order: 2,
        duration: 30,
        difficulty: 'Easy',
        isCompleted: false
      },
      {
        id: 'lesson-3-3',
        title: 'Functions and Modules',
        description: 'Creating reusable code with functions',
        content: 'Functions are blocks of code that perform specific tasks...',
        order: 3,
        duration: 25,
        difficulty: 'Medium',
        isCompleted: false
      },
      {
        id: 'lesson-3-4',
        title: 'Data Structures',
        description: 'Lists, dictionaries, and sets in Python',
        content: 'Python provides several built-in data structures...',
        order: 4,
        duration: 35,
        difficulty: 'Medium',
        isCompleted: false
      },
      {
        id: 'lesson-3-5',
        title: 'File Handling',
        description: 'Reading from and writing to files',
        content: 'File handling is an important part of programming...',
        order: 5,
        duration: 20,
        difficulty: 'Hard',
        isCompleted: false
      }
    ],
    isPublic: true
  }
]

function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundCourse = mockCourses.find(c => c.id === id)
      setCourse(foundCourse || null)
      setLoading(false)
    }, 500)
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


  const getTotalDuration = (lessons: Lesson[]) => {
    return lessons.reduce((total, lesson) => total + lesson.duration, 0)
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
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
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
                  <div><strong>Total Duration:</strong> {getTotalDuration(course.lessons)} minutes</div>
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
                            <Card.Title className="mb-0 me-2">{lesson.title}</Card.Title>
                            <Badge bg={getDifficultyColor(lesson.difficulty)} size="sm">
                              {lesson.difficulty}
                            </Badge>
                          </div>
                          <Card.Text className="text-muted mb-0">
                            {lesson.description}
                          </Card.Text>
                        </Col>
                        <Col md={3} className="text-center">
                          <small className="text-muted">{lesson.duration} minutes</small>
                        </Col>
                        <Col md={2} className="text-end">
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
