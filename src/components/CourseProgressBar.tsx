import ProgressBar from 'react-bootstrap/ProgressBar'
import { Lesson } from '../types'
import { getCourseProgress } from '../utils/progressCalculations'

interface CourseProgressBarProps {
  lessons: Lesson[]
  showLabel?: boolean
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function CourseProgressBar({ 
  lessons, 
  showLabel = true, 
  showText = true,
  size = 'md',
  className = '' 
}: CourseProgressBarProps) {
  const { completedCount, totalCount, percentage } = getCourseProgress(lessons)
  
  return (
    <div className={className}>
      {showText && (
        <div className="d-flex align-items-center mb-2">
          <strong className="me-2">Progress:</strong>
          <span className="me-2">
            {completedCount} of {totalCount} lessons completed
          </span>
        </div>
      )}
      <ProgressBar 
        now={percentage} 
        label={showLabel ? `${Math.round(percentage)}%` : undefined}
        className={`mb-2 ${size === 'sm' ? 'progress-sm' : size === 'lg' ? 'progress-lg' : ''}`}
      />
    </div>
  )
}

export default CourseProgressBar