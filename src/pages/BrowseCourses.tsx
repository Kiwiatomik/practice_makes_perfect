import { useState, useEffect } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import { Link } from 'react-router'
import { useSearchCourses } from '../hooks/useSearchCourses'
import CourseCard from '../components/CourseCard'
import LoadingState from '../components/shared/LoadingState'
import ErrorState from '../components/shared/ErrorState'
import { sanitizeCourseError } from '../utils/errorSanitization'


function BrowseCourses() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')

  const { courses, loading, error, subjects, refetch } = useSearchCourses({
    searchTerm,
    selectedSubject,
    selectedLevel
  })

  // SEO: Update document title and meta description
  useEffect(() => {
    document.title = 'All Courses - Practice Makes Perfect'
    
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Browse our comprehensive collection of mathematics and programming courses. Learn calculus, algebra, Python programming and more with interactive AI-powered exercises.')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = 'Browse our comprehensive collection of mathematics and programming courses. Learn calculus, algebra, Python programming and more with interactive AI-powered exercises.'
      document.head.appendChild(meta)
    }
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Practice Makes Perfect'
    }
  }, [])


  if (loading) {
    return <LoadingState message="Loading courses..." />
  }
  
  if (error) {
    return (
      <ErrorState 
        title="Error Loading Courses" 
        message={sanitizeCourseError(error)} 
        onRetry={refetch} 
      />
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
                  aria-label="Search courses"
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                aria-label="Filter by subject"
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
                aria-label="Filter by level"
              >
                <option value="">All Levels</option>
                <option value="highschool">High school</option>
                <option value="bachelor">Bachelor</option>
                <option value="master">Master</option>
              </Form.Select>
            </Col>
          </Row>

          {courses.length === 0 ? (
            <div className="text-center my-5">
              <h4>No courses found</h4>
              <p>Try adjusting your search criteria or check back later for new content.</p>
            </div>
          ) : (
            <Row className="g-4">
              {courses.map(course => (
                <Col key={course.id} md={6}>
                  <CourseCard course={course} />
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default BrowseCourses
