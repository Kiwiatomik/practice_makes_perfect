import { useParams } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useGetCourse } from '../hooks/useGetCourse'
import LessonCard from '../components/LessonCard'
import CourseProgressBar from '../components/CourseProgressBar'
import LoadingState from '../components/shared/LoadingState'
import ErrorState from '../components/shared/ErrorState'
import analyticsService from '../services/analyticsService'
import performanceService from '../services/performanceService'
import loggingService from '../services/loggingService'
import { useEffect, useState } from 'react'


function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const { course, loading, error } = useGetCourse(id)
  const [, setPageLoadTrace] = useState<any>(null)

  // Performance and analytics tracking
  useEffect(() => {
    const trace = performanceService.measurePageLoad('course_page')
    setPageLoadTrace(trace)

    // Track course view
    if (id && course?.title) {
      analyticsService.trackCourseView(id, course.title)
      loggingService.courseEvent('course_page_loaded', id, {
        courseTitle: course.title,
        isCreator: course?.createdBy?.id === currentUser?.uid
      })
    }

    return () => {
      if (trace) {
        performanceService.stopTrace(trace)
      }
    }
  }, [id, course?.title, course?.createdBy?.id, currentUser?.uid])

  // Debug logging for authorization check
  console.log('CoursePage Debug - Current User:', currentUser)
  console.log('CoursePage Debug - Current User UID:', currentUser?.uid)
  console.log('CoursePage Debug - Course:', course)
  console.log('CoursePage Debug - Course createdBy:', course?.createdBy)
  console.log('CoursePage Debug - Course createdBy UID:', course?.createdBy?.id)
  console.log('CoursePage Debug - Is creator?:', course?.createdBy?.id === currentUser?.uid)

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
              <h1 className="mb-0 me-3">{course?.title}</h1>
            </div>
            <p className="lead mb-3">{course?.description}</p>

            <Row className="mb-4">
              <Col md={6}>
                <CourseProgressBar lessons={(course as any)?.lessons || []} />
              </Col>
              <Col md={6}>
                <div className="text-md-end">
                  <div><strong>Created by:</strong> {course?.createdBy?.displayName}</div>
                  <div><strong>Updated:</strong> {course?.updatedAt?.toLocaleDateString()}</div>
                </div>
              </Col>
            </Row>
          </div>

          <h2 className="mb-4">Lessons</h2>

          <Row className="g-3">
            {(course as any)?.lessons
              ?.sort((a: any, b: any) => a.order - b.order)
              ?.map((lesson: any, index: number) => (
                <Col key={lesson.id} xs={12}>
                  <LessonCard
                    lesson={lesson}
                    courseId={course?.id || ''}
                    lessonNumber={index + 1}
                    showNumber={true}
                  />
                </Col>
              ))}
          </Row>

          {currentUser && course?.createdBy?.id === currentUser.uid && (
            <div className="mt-3 text-center">
              <Button
                as={Link as any}
                to={`/course/${course?.id}/add-lesson`}
                variant="outline-primary"
                size="sm"
              >
                + Add Lesson
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default CoursePage
