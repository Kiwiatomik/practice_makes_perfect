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
      <Card.Header className="d-flex align-items-center justify-content-between">
        <Card.Title className="mb-0">{course.title}</Card.Title>
        <div>
          <Badge className="tag-subject me-2">{course.subject}</Badge>
          <Badge className="tag-subject">
            {course.level}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body className="d-flex flex-column">
        <Card.Text className="flex-grow-1">
          {course.description}
        </Card.Text>

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
