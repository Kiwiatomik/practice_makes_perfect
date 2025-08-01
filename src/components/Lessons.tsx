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
import { Lesson } from '../types'

const mockLessons: Lesson[] = [
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
    difficulty: 3,
    subject: 'Mathematics',
    tags: ['calculus', 'derivatives', 'mathematics'],
    questionCount: 25,
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
    difficulty: 4,
    subject: 'Mathematics',
    tags: ['linear-algebra', 'vectors', 'matrices'],
    questionCount: 18,
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
    difficulty: 2,
    subject: 'Programming',
    tags: ['python', 'programming', 'basics'],
    questionCount: 32,
    isPublic: true
  }
]

function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setLessons(mockLessons)
      setLoading(false)
    }, 500)
  }, [])

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = searchTerm === '' || 
                         lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.createdBy.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSubject = selectedSubject === '' || lesson.subject === selectedSubject
    
    const matchesDifficulty = selectedDifficulty === '' || 
                             (selectedDifficulty === 'highschool' && lesson.difficulty <= 2) ||
                             (selectedDifficulty === 'bachelor' && lesson.difficulty === 3) ||
                             (selectedDifficulty === 'master' && lesson.difficulty >= 4)
    
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  const subjects = [...new Set(lessons.map(lesson => lesson.subject))]

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'success'
    if (difficulty <= 3) return 'warning'
    return 'danger'
  }

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return 'High school'
    if (difficulty <= 3) return 'Bachelor'
    return 'Master'
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
          <h1 className="mb-4">All Lessons</h1>
          
          <Row className="mb-4">
            <Col md={6}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search lessons, descriptions, creators, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
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
            <Col md={3}>
              <Form.Select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                <option value="">All Levels</option>
                <option value="highschool">High school</option>
                <option value="bachelor">Bachelor</option>
                <option value="master">Master</option>
              </Form.Select>
            </Col>
          </Row>

          {filteredLessons.length === 0 ? (
            <div className="text-center text-muted my-5">
              <h4>No lessons found</h4>
              <p>Try adjusting your search criteria or check back later for new content.</p>
            </div>
          ) : (
            <Row className="g-4">
              {filteredLessons.map(lesson => (
                <Col key={lesson.id} md={6} lg={4}>
                  <Card className="h-100">
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-2">
                        <Badge bg={getDifficultyColor(lesson.difficulty)} className="me-2">
                          {getDifficultyText(lesson.difficulty)}
                        </Badge>
                        <Badge bg="secondary">{lesson.subject}</Badge>
                      </div>
                      
                      <Card.Title className="mb-2">{lesson.title}</Card.Title>
                      <Card.Text className="flex-grow-1">
                        {lesson.description}
                      </Card.Text>
                      
                      <div className="mb-3">
                        <small className="text-muted d-block">
                          Created by: <strong>{lesson.createdBy.displayName}</strong>
                        </small>
                        <small className="text-muted d-block">
                          {lesson.questionCount} questions • Updated {lesson.updatedAt.toLocaleDateString()}
                        </small>
                      </div>

                      <div className="mb-3">
                        {lesson.tags.map(tag => (
                          <Badge key={tag} bg="light" text="dark" className="me-1 mb-1">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="mt-auto">
                        <Link to={`/lesson/${lesson.id}`} className="btn btn-primary w-100">
                          Start Lesson
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

export default Lessons
