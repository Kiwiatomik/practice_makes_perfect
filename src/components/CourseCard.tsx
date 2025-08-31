import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import { Link } from 'react-router'
import { Course } from '../types'
import { getLevelColor } from '../utils/badgeColors'

interface CourseCardProps {
  course: Course
  className?: string
}

function CourseCard({ course, className = '' }: CourseCardProps) {

  return (
    <Card className={`h-100 ${className}`}>
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
  )
}

export default CourseCard