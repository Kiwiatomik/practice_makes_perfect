import { useState, useEffect } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Alert from 'react-bootstrap/Alert'
import { Link } from 'react-router'
import { Course } from '../types'
import { coursesService, CourseFilters } from '../services/coursesService'


function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: CourseFilters = {
        isPublic: true
      }
      
      if (selectedSubject) {
        filters.subject = selectedSubject
      }
      
      if (selectedLevel) {
        const levelMap: Record<string, string> = {
          'highschool': 'High school',
          'bachelor': 'Bachelor',
          'master': 'Master'
        }
        filters.level = levelMap[selectedLevel]
      }
      
      if (searchTerm) {
        filters.searchTerm = searchTerm
      }
      
      const fetchedCourses = await coursesService.getAllCourses(filters)
      setCourses(fetchedCourses)
      setFilteredCourses(fetchedCourses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchCourses()
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, selectedSubject, selectedLevel])


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
            <span className="visually-hidden">Loading courses...</span>
          </div>
          <p className="mt-2 text-muted">Loading courses...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Courses</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchCourses}>
            Try Again
          </Button>
        </Alert>
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
            <div className="text-center my-5">
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

                      <div className="mb-3 d-flex justify-content-end">
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
