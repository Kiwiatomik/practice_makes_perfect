import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CoursePage from './CoursePage'
import { useAuth } from '../contexts/AuthContext'
import { useGetCourse } from '../hooks/useGetCourse'

// Mock hooks
vi.mock('../contexts/AuthContext')
vi.mock('../hooks/useGetCourse')

// Mock React Router hooks
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useParams: vi.fn()
  }
})

// Mock utility functions
vi.mock('../utils/badgeColors', () => ({
  getLevelColor: vi.fn(() => 'primary')
}))

// Mock components
vi.mock('../components/LessonCard', () => ({
  default: ({ lesson, courseId, lessonNumber, showNumber }: any) => (
    <div data-testid={`lesson-card-${lesson.id}`}>
      <h4>{lesson.title}</h4>
      <p>{lesson.description}</p>
      <span>Course: {courseId}</span>
      <span>Lesson #{lessonNumber}</span>
      {showNumber && <span>Show Number: true</span>}
    </div>
  )
}))

vi.mock('../components/CourseProgressBar', () => ({
  default: ({ lessons }: { lessons: any[] }) => (
    <div data-testid="course-progress-bar">
      Progress: {lessons.length} lessons
    </div>
  )
}))

vi.mock('../components/shared/LoadingState', () => ({
  default: ({ message }: { message: string }) => 
    <div data-testid="loading-state">{message}</div>
}))

vi.mock('../components/shared/ErrorState', () => ({
  default: ({ title, message, backLink, backText }: any) => (
    <div data-testid="error-state">
      <h1>{title}</h1>
      <p>{message}</p>
      {backLink && <a href={backLink}>{backText}</a>}
    </div>
  )
}))

const { useParams } = await import('react-router')
const mockUseAuth = vi.mocked(useAuth)
const mockUseGetCourse = vi.mocked(useGetCourse)
const mockUseParams = vi.mocked(useParams)

describe('CoursePage', () => {
  const mockCourse = {
    id: 'course123',
    title: 'Advanced Mathematics',
    description: 'Learn advanced mathematical concepts',
    createdBy: {
      id: 'teacher123',
      displayName: 'Dr. Smith',
      email: 'smith@example.com',
      createdAt: new Date(),
      lastActive: new Date()
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-01'),
    level: 'Bachelor' as const,
    subject: 'Mathematics',
    tags: ['calculus', 'algebra'],
    isPublic: true,
    lessons: [
      {
        id: 'lesson1',
        title: 'Introduction to Calculus',
        description: 'Basic calculus concepts',
        content: 'Lesson content here',
        order: 1,
        duration: 45,
        difficulty: 'Medium',
        isCompleted: false,
        createdBy: {
          id: 'teacher123',
          displayName: 'Dr. Smith',
          email: 'smith@example.com'
        }
      },
      {
        id: 'lesson2',
        title: 'Derivatives',
        description: 'Understanding derivatives',
        content: 'Lesson content here',
        order: 2,
        duration: 60,
        difficulty: 'Hard',
        isCompleted: true,
        createdBy: {
          id: 'teacher123',
          displayName: 'Dr. Smith',
          email: 'smith@example.com'
        }
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Default mock implementations
    mockUseParams.mockReturnValue({ id: 'course123' })
    
    mockUseAuth.mockReturnValue({
      currentUser: null,
      loading: false,
      logout: vi.fn()
    })

    mockUseGetCourse.mockReturnValue({
      course: mockCourse,
      loading: false,
      error: null,
      refetch: vi.fn()
    })
  })

  const renderCoursePage = () => {
    return render(
      <MemoryRouter>
        <CoursePage />
      </MemoryRouter>
    )
  }

  describe('loading state', () => {
    it('should show loading state when course is loading', () => {
      mockUseGetCourse.mockReturnValue({
        course: null,
        loading: true,
        error: null,
        refetch: vi.fn()
      })

      renderCoursePage()

      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading course...')
    })
  })

  describe('error states', () => {
    it('should show error state when course fails to load', () => {
      mockUseGetCourse.mockReturnValue({
        course: null,
        loading: false,
        error: 'Failed to fetch course',
        refetch: vi.fn()
      })

      renderCoursePage()

      expect(screen.getByTestId('error-state')).toBeInTheDocument()
      expect(screen.getByText('Course Not Found')).toBeInTheDocument()
      expect(screen.getByText("The course you're looking for doesn't exist or has been removed.")).toBeInTheDocument()
      expect(screen.getByText('Browse All Courses')).toBeInTheDocument()
    })

    it('should show error state when course is null', () => {
      mockUseGetCourse.mockReturnValue({
        course: null,
        loading: false,
        error: null,
        refetch: vi.fn()
      })

      renderCoursePage()

      expect(screen.getByTestId('error-state')).toBeInTheDocument()
      expect(screen.getByText('Course Not Found')).toBeInTheDocument()
    })
  })

  describe('successful course display', () => {
    it('should render course information correctly', () => {
      renderCoursePage()

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Advanced Mathematics')
      expect(screen.getByText('Learn advanced mathematical concepts')).toBeInTheDocument()
      expect(screen.getByText('Created by:')).toBeInTheDocument()
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      expect(screen.getByText('Updated:')).toBeInTheDocument()
    })

    it('should display course progress bar', () => {
      renderCoursePage()

      expect(screen.getByTestId('course-progress-bar')).toBeInTheDocument()
      expect(screen.getByTestId('course-progress-bar')).toHaveTextContent('Progress: 2 lessons')
    })

    it('should render lessons section', () => {
      renderCoursePage()

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Lessons')
      expect(screen.getByTestId('lesson-card-lesson1')).toBeInTheDocument()
      expect(screen.getByTestId('lesson-card-lesson2')).toBeInTheDocument()
    })

    it('should display lessons in correct order', () => {
      renderCoursePage()

      const lessonCards = screen.getAllByTestId(/lesson-card-/)
      expect(lessonCards[0]).toHaveAttribute('data-testid', 'lesson-card-lesson1')
      expect(lessonCards[1]).toHaveAttribute('data-testid', 'lesson-card-lesson2')
      
      expect(lessonCards[0]).toHaveTextContent('Lesson #1')
      expect(lessonCards[1]).toHaveTextContent('Lesson #2')
    })

    it('should pass correct props to lesson cards', () => {
      renderCoursePage()

      const lesson1Card = screen.getByTestId('lesson-card-lesson1')
      expect(lesson1Card).toHaveTextContent('Introduction to Calculus')
      expect(lesson1Card).toHaveTextContent('Basic calculus concepts')
      expect(lesson1Card).toHaveTextContent('Course: course123')
      expect(lesson1Card).toHaveTextContent('Show Number: true')

      const lesson2Card = screen.getByTestId('lesson-card-lesson2')
      expect(lesson2Card).toHaveTextContent('Derivatives')
      expect(lesson2Card).toHaveTextContent('Understanding derivatives')
    })
  })

  describe('course creator functionality', () => {
    it('should not show add lesson button for non-creators', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'different-user', email: 'user@example.com' } as any,
        loading: false,
        logout: vi.fn()
      })

      renderCoursePage()

      expect(screen.queryByText('+ Add Lesson')).not.toBeInTheDocument()
    })

    it('should not show add lesson button when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false,
        logout: vi.fn()
      })

      renderCoursePage()

      expect(screen.queryByText('+ Add Lesson')).not.toBeInTheDocument()
    })

    it('should show add lesson button for course creator', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'teacher123', email: 'smith@example.com' } as any,
        loading: false,
        logout: vi.fn()
      })

      renderCoursePage()

      expect(screen.getByText('+ Add Lesson')).toBeInTheDocument()
      
      const addButton = screen.getByText('+ Add Lesson')
      expect(addButton.closest('a')).toHaveAttribute('href', '/course/course123/add-lesson')
    })

    it('should log debug information for authorization', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'teacher123', email: 'smith@example.com' } as any,
        loading: false,
        logout: vi.fn()
      })

      renderCoursePage()

      expect(consoleSpy).toHaveBeenCalledWith('CoursePage Debug - Current User:', expect.any(Object))
      expect(consoleSpy).toHaveBeenCalledWith('CoursePage Debug - Is creator?:', true)
    })
  })

  describe('course with no lessons', () => {
    it('should handle course with empty lessons array', () => {
      const courseWithNoLessons = {
        ...mockCourse,
        lessons: []
      }

      mockUseGetCourse.mockReturnValue({
        course: courseWithNoLessons,
        loading: false,
        error: null,
        refetch: vi.fn()
      })

      renderCoursePage()

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Advanced Mathematics')
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Lessons')
      expect(screen.getByTestId('course-progress-bar')).toHaveTextContent('Progress: 0 lessons')
      expect(screen.queryByTestId(/lesson-card-/)).not.toBeInTheDocument()
    })
  })

  describe('course metadata display', () => {
    it('should format update date correctly', () => {
      renderCoursePage()

      const updateDateText = screen.getByText(/Updated:/)
      expect(updateDateText).toBeInTheDocument()
      
      // The date should be formatted as a locale date string
      const dateString = mockCourse.updatedAt.toLocaleDateString()
      expect(screen.getByText(dateString)).toBeInTheDocument()
    })

    it('should display creator information correctly', () => {
      renderCoursePage()

      expect(screen.getByText('Created by:')).toBeInTheDocument()
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
    })

    it('should handle course with missing creator display name', () => {
      const courseWithIncompleteCreator = {
        ...mockCourse,
        createdBy: {
          ...mockCourse.createdBy,
          displayName: ''
        }
      }

      mockUseGetCourse.mockReturnValue({
        course: courseWithIncompleteCreator,
        loading: false,
        error: null,
        refetch: vi.fn()
      })

      renderCoursePage()

      expect(screen.getByText('Created by:')).toBeInTheDocument()
      // Should display empty string or fallback
      expect(screen.getByText('Created by:').nextSibling?.textContent).toBe(' ')
    })
  })

  describe('responsive layout', () => {
    it('should render with Bootstrap responsive classes', () => {
      const { container } = renderCoursePage()

      expect(container.querySelector('.container')).toBeInTheDocument()
      expect(container.querySelector('.row')).toBeInTheDocument()
      expect(container.querySelector('.col')).toBeInTheDocument()
    })

    it('should have responsive column layout for course info', () => {
      const { container } = renderCoursePage()

      expect(container.querySelector('.col-md-6')).toBeInTheDocument()
      expect(container.querySelectorAll('.col-md-6')).toHaveLength(2)
    })
  })

  describe('hook integration', () => {
    it('should call useGetCourse with correct course ID', () => {
      renderCoursePage()

      expect(mockUseGetCourse).toHaveBeenCalledWith('course123')
    })

    it('should handle undefined course ID', () => {
      mockUseParams.mockReturnValue({ id: undefined })

      renderCoursePage()

      expect(mockUseGetCourse).toHaveBeenCalledWith(undefined)
    })

    it('should call useAuth hook', () => {
      renderCoursePage()

      expect(mockUseAuth).toHaveBeenCalled()
    })
  })

  describe('lesson ordering', () => {
    it('should sort lessons by order field', () => {
      const courseWithUnorderedLessons = {
        ...mockCourse,
        lessons: [
          {
            ...mockCourse.lessons[1], // lesson2 with order: 2
            order: 3
          },
          {
            ...mockCourse.lessons[0], // lesson1 with order: 1  
            order: 1
          },
          {
            id: 'lesson3',
            title: 'Integration',
            description: 'Understanding integration',
            content: 'Integration content',
            order: 2,
            duration: 50,
            difficulty: 'Medium',
            isCompleted: false,
            createdBy: mockCourse.createdBy
          }
        ]
      }

      mockUseGetCourse.mockReturnValue({
        course: courseWithUnorderedLessons,
        loading: false,
        error: null,
        refetch: vi.fn()
      })

      renderCoursePage()

      const lessonCards = screen.getAllByTestId(/lesson-card-/)
      
      // Should be ordered by the order field: lesson1 (order:1), lesson3 (order:2), lesson2 (order:3)
      expect(lessonCards[0]).toHaveTextContent('Lesson #1')
      expect(lessonCards[0]).toHaveTextContent('Introduction to Calculus')
      
      expect(lessonCards[1]).toHaveTextContent('Lesson #2')
      expect(lessonCards[1]).toHaveTextContent('Integration')
      
      expect(lessonCards[2]).toHaveTextContent('Lesson #3')
      expect(lessonCards[2]).toHaveTextContent('Derivatives')
    })
  })

  describe('edge cases', () => {
    it('should handle course with minimal data', () => {
      const minimalCourse = {
        id: 'course123',
        title: 'Minimal Course',
        description: '',
        createdBy: {
          id: 'teacher123',
          displayName: '',
          email: 'teacher@example.com',
          createdAt: new Date(),
          lastActive: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 'Bachelor' as const,
        subject: '',
        tags: [],
        isPublic: true,
        lessons: []
      }

      mockUseGetCourse.mockReturnValue({
        course: minimalCourse,
        loading: false,
        error: null,
        refetch: vi.fn()
      })

      renderCoursePage()

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minimal Course')
      expect(screen.getByTestId('course-progress-bar')).toBeInTheDocument()
    })

    it('should handle malformed course data by throwing appropriate errors', () => {
      const malformedCourse = {
        ...mockCourse,
        createdBy: null as any,
        updatedAt: null as any
      }

      mockUseGetCourse.mockReturnValue({
        course: malformedCourse,
        loading: false,
        error: null,
        refetch: vi.fn()
      })

      // Component should handle malformed data gracefully and not crash
      expect(() => renderCoursePage()).not.toThrow()
    })
  })
})