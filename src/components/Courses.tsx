import { useState, useEffect } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import { Link } from 'react-router'
import { Course } from '../types'

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
      { id: 'lesson-1-1', title: '', description: '', content: '', order: 1, duration: 15, difficulty: 'Easy', isCompleted: false },
      { id: 'lesson-1-2', title: '', description: '', content: '', order: 2, duration: 25, difficulty: 'Medium', isCompleted: false },
      { id: 'lesson-1-3', title: '', description: '', content: '', order: 3, duration: 30, difficulty: 'Medium', isCompleted: false },
      { id: 'lesson-1-4', title: '', description: '', content: '', order: 4, duration: 35, difficulty: 'Hard', isCompleted: false }
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
      { id: 'lesson-2-1', title: '', description: '', content: '', order: 1, duration: 20, difficulty: 'Easy', isCompleted: false },
      { id: 'lesson-2-2', title: '', description: '', content: '', order: 2, duration: 40, difficulty: 'Medium', isCompleted: false },
      { id: 'lesson-2-3', title: '', description: '', content: '', order: 3, duration: 45, difficulty: 'Hard', isCompleted: false }
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
      { id: 'lesson-3-1', title: '', description: '', content: '', order: 1, duration: 20, difficulty: 'Easy', isCompleted: false },
      { id: 'lesson-3-2', title: '', description: '', content: '', order: 2, duration: 30, difficulty: 'Easy', isCompleted: false },
      { id: 'lesson-3-3', title: '', description: '', content: '', order: 3, duration: 25, difficulty: 'Medium', isCompleted: false },
      { id: 'lesson-3-4', title: '', description: '', content: '', order: 4, duration: 35, difficulty: 'Medium', isCompleted: false },
      { id: 'lesson-3-5', title: '', description: '', content: '', order: 5, duration: 20, difficulty: 'Hard', isCompleted: false }
    ],
    isPublic: true
  }
]

function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setCourses(mockCourses)
      setLoading(false)
    }, 500)
  }, [])

  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
                         course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.createdBy.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSubject = selectedSubject === '' || course.subject === selectedSubject
    
    const matchesLevel = selectedLevel === '' || 
                        (selectedLevel === 'highschool' && course.level === 'High school') ||
                        (selectedLevel === 'bachelor' && course.level === 'Bachelor') ||
                        (selectedLevel === 'master' && course.level === 'Master')
    
    return matchesSearch && matchesSubject && matchesLevel
  })

  const subjects = [...new Set(courses.map(course => course.subject))]

  const getLevelColor = (level: string) => {
    if (level === 'High school') return 'info'
    if (level === 'Bachelor') return 'primary'
    return 'dark'
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

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <h1 className="mb-4">All Courses</h1>
          
          <Row className="mb-4">
            <Col md={8}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search courses, descriptions, creators, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="highschool">High school</option>
                <option value="bachelor">Bachelor</option>
                <option value="master">Master</option>
              </Form.Select>
            </Col>
          </Row>

          {filteredCourses.length === 0 ? (
            <div className="text-center text-muted my-5">
              <h4>No courses found</h4>
              <p>Try adjusting your search criteria or check back later for new content.</p>
            </div>
          ) : (
            <Row className="g-4">
              {filteredCourses.map(course => (
                <Col key={course.id} md={6}>
                  <Card className="h-100">
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <Card.Title className="mb-0">{course.title}</Card.Title>
                        <div>
                          <Badge bg="secondary" className="me-2">{course.subject}</Badge>
                          <Badge bg={getLevelColor(course.level)}>
                            {course.level}
                          </Badge>
                        </div>
                      </div>
                      <Card.Text className="flex-grow-1">
                        {course.description}
                      </Card.Text>

                      <div className="mb-3 d-flex justify-content-between">
                        <small className="text-muted">
                          {course.lessons.length} lessons
                        </small>
                        <small className="text-muted">
                          {course.createdBy.displayName}
                        </small>
                      </div>
                      
                      <div className="mt-auto">
                        <Link to={`/course/${course.id}`} className="btn btn-primary w-100">
                          View Course
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default Courses
