import { useParams, Navigate } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Badge from 'react-bootstrap/Badge'
import { Link } from 'react-router'
import { useGetCourse } from '../hooks/useGetCourse'
import LessonCard from '../components/LessonCard'
import CourseProgressBar from '../components/CourseProgressBar'
import { getLevelColor } from '../utils/badgeColors'
import LoadingState from '../components/shared/LoadingState'
import ErrorState from '../components/shared/ErrorState'


function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const { course, loading, error, refetch } = useGetCourse(id)

  if (loading) {
    return <LoadingState message="Loading course..." />
  }

  // Show error state for missing courses or course not found errors
  if (!loading && (error || !course)) {
    return (
      <ErrorState 
        title="Course Not Found" 
        message="The course you're looking for doesn't exist or has been removed." 
        backLink="/courses" 
        backText="Browse All Courses" 
      />
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
                <CourseProgressBar lessons={course.lessons} />
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
                  <LessonCard 
                    lesson={lesson} 
                    lessonNumber={index + 1}
                    showNumber={true}
                  />
                </Col>
              ))}
          </Row>
        </Col>
      </Row>
    </Container>
  )
}

export default CoursePage
