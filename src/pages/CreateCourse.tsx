import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import { useAuth } from '../contexts/AuthContext'
import { coursesService } from '../services/coursesService'
import { useUserCourses } from '../hooks/useUserCourses'
import { getLevelColor } from '../utils/badgeColors'
import LoadingState from '../components/shared/LoadingState'

function CreateCourse() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { courses: userCourses, loading: coursesLoading, refetch: refetchCourses } = useUserCourses({ 
    userId: currentUser?.uid 
  })
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    level: 'High school' as 'High school' | 'Bachelor' | 'Master',
    tags: [] as string[],
    tagInput: '',
    isPublic: true
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleAddTag = () => {
    const tag = formData.tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: ''
      }))
    }
  }
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }
  
  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) {
      setError('You must be logged in to create a course')
      return
    }
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.subject.trim()) {
      setError('Please fill in all required fields')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject.trim(),
        level: formData.level,
        tags: formData.tags,
        isPublic: formData.isPublic,
        lessons: [], // Empty lessons array initially
        createdBy: {
          id: currentUser.uid,
          uid: currentUser.uid, // Keep for backward compatibility
          displayName: currentUser.displayName || 'Anonymous',
          email: currentUser.email || '',
          createdAt: new Date(),
          lastActive: new Date()
        }
      }
      
      const courseId = await coursesService.createCourse(courseData)
      setSuccess(true)
      
      // Return to courses list after success
      setTimeout(() => {
        setShowCreateForm(false)
        setSuccess(false)
        refetchCourses() // Refresh the courses list
        // Reset form
        setFormData({
          title: '',
          description: '',
          subject: '',
          level: 'High school',
          tags: [],
          tagInput: '',
          isPublic: true
        })
      }, 2000)
      
    } catch (error) {
      console.error('Failed to create course:', error)
      setError(error instanceof Error ? error.message : 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }
  
  if (coursesLoading) {
    return <LoadingState message="Loading your courses..." />
  }

  return (
    <Container className="my-4">
      {!showCreateForm ? (
        // Show user's courses list
        <>
          <Row className="mb-4">
            <Col>
              <h2>My Courses</h2>
            </Col>
          </Row>

          {userCourses.length === 0 ? (
            <Row className="justify-content-center">
              <Col md={6} className="text-center">
                <Card className="p-4">
                  <Card.Body>
                    <h5 className="mb-3">No courses yet</h5>
                    <p className="text-muted mb-4">
                      Create your first course to start teaching and sharing knowledge with students.
                    </p>
                    <Button 
                      variant="primary"
                      onClick={() => setShowCreateForm(true)}
                    >
                      Create Your First Course
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <>
              <Row className="g-4">
                {userCourses.map(course => (
                  <Col key={course.id} md={6} lg={4}>
                    <Card className="h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Badge bg={getLevelColor(course.level)} className="mb-2">
                            {course.level}
                          </Badge>
                          <small className="text-muted">
                            {course.lessons?.length || 0} lessons
                          </small>
                        </div>
                        <Card.Title>
                          <Link 
                            to={`/course/${course.id}`}
                            className="text-decoration-none"
                          >
                            {course.title}
                          </Link>
                        </Card.Title>
                        <Card.Text className="text-muted small mb-3">
                          {course.description}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <Badge bg="secondary">{course.subject}</Badge>
                          <Button 
                            as={Link}
                            to={`/course/${course.id}`}
                            variant="outline-primary" 
                            size="sm"
                          >
                            Manage
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Row className="mt-4">
                <Col className="text-center">
                  <Button 
                    variant="outline-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    + Create New Course
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </>
      ) : (
        // Show create course form
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="mb-0">Create New Course</h2>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    ← Back to My Courses
                  </Button>
                </div>
              </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success">
                  Course created successfully! Redirecting to course page...
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                {/* Title */}
                <Form.Group className="mb-3">
                  <Form.Label>Course Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter course title"
                    required
                  />
                </Form.Group>
                
                {/* Description */}
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what students will learn in this course"
                    required
                  />
                </Form.Group>
                
                {/* Subject and Level Row */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="e.g., Mathematics, Programming, Physics"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Level</Form.Label>
                      <Form.Select 
                        value={formData.level}
                        onChange={(e) => handleInputChange('level', e.target.value)}
                      >
                        <option value="High school">High school</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Tags */}
                <Form.Group className="mb-3">
                  <Form.Label>Tags</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={formData.tagInput}
                      onChange={(e) => handleInputChange('tagInput', e.target.value)}
                      placeholder="Add a tag and press Enter"
                      onKeyPress={handleTagInputKeyPress}
                    />
                    <Button 
                      type="button" 
                      variant="outline-primary" 
                      onClick={handleAddTag}
                      disabled={!formData.tagInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="badge bg-secondary d-flex align-items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            className="btn-close btn-close-white"
                            style={{ fontSize: '0.75em' }}
                            onClick={() => handleRemoveTag(tag)}
                            aria-label={`Remove ${tag} tag`}
                          />
                        </span>
                      ))}
                    </div>
                  )}
                  <Form.Text className="text-muted">
                    Tags help students find your course more easily
                  </Form.Text>
                </Form.Group>
                
                {/* Public/Private */}
                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="isPublic"
                    label="Make this course public"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Public courses can be discovered and accessed by all users
                  </Form.Text>
                </Form.Group>
                
                {/* Submit Button */}
                <div className="d-flex gap-2">
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={loading || success}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Course'
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/courses')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}
    </Container>
  )
}

export default CreateCourse
