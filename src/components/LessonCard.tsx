import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { Link } from 'react-router'
import { Lesson } from '../types'
import { getDifficultyColor } from '../utils/badgeColors'

interface LessonCardProps {
  lesson: Lesson
  courseId: string
  lessonNumber?: number
  showNumber?: boolean
  className?: string
}

function LessonCard({ 
  lesson, 
  courseId,
  lessonNumber = 1, 
  showNumber = true, 
  className = '' 
}: LessonCardProps) {

  return (
    <Card className={`h-100 ${lesson.isCompleted ? 'border-success' : ''} ${className}`}>
      <Card.Body>
        <Row className="align-items-center">
          {showNumber && (
            <Col md={1} className="text-center">
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                lesson.isCompleted ? 'bg-success text-white' : 'bg-light'
              }`} style={{ width: '40px', height: '40px' }}>
                {lesson.isCompleted ? '✓' : lessonNumber}
              </div>
            </Col>
          )}
          <Col md={showNumber ? 6 : 7}>
            <div className="d-flex align-items-center mb-1">
              <Card.Title className="mb-0 me-2">
                <Link 
                  to={`/course/${courseId}/lesson/${lesson.id}`} 
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
          <Col md={showNumber ? 5 : 4} className="text-end">
            <Button
              as={Link}
              to={`/course/${courseId}/lesson/${lesson.id}`}
              variant={lesson.isCompleted ? 'outline-success' : 'primary'}
              size="sm"
            >
              {lesson.isCompleted ? 'Review' : 'Start'}
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default LessonCard