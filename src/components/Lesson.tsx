import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import { Link } from 'react-router'
import { Lesson as LessonType, Prompt, Working } from '../types'
import { coursesService } from '../services/coursesService'
import { deepseekService } from '../services/deepseekService'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

function Lesson() {
  const { id } = useParams<{ id: string }>()
  const [lesson, setLesson] = useState<LessonType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [firstPrompt, setFirstPrompt] = useState<Prompt | null>(null)
  const [promptLoading, setPromptLoading] = useState(false)
  const [interpretedPrompt, setInterpretedPrompt] = useState<string | null>(null)
  const [interpretationLoading, setInterpretationLoading] = useState(false)
  const [interpretationError, setInterpretationError] = useState<string | null>(null)
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false)
  const [practiceQuestionLoading, setPracticeQuestionLoading] = useState(false)
  const [practiceQuestionError, setPracticeQuestionError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [currentWorkings, setCurrentWorkings] = useState<Working[] | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null)
  const [nextLevelLoading, setNextLevelLoading] = useState(false)
  const [nextLevelError, setNextLevelError] = useState<string | null>(null)

  const fetchLesson = async () => {
    if (!id) {
      setError('Lesson ID is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const fetchedLesson = await coursesService.getLessonById(id)
      setLesson(fetchedLesson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  const fetchFirstPrompt = async () => {
    if (!lesson?.courseId || !id) return;
    
    try {
      setPromptLoading(true);
      const prompt = await coursesService.getFirstPromptByLessonId(lesson.courseId, id);
      setFirstPrompt(prompt);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      // Don't show error for prompts - just means no prompts exist
    } finally {
      setPromptLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson()
  }, [id])

  useEffect(() => {
    if (lesson?.courseId) {
      fetchFirstPrompt();
    }
  }, [lesson?.courseId, id])

  useEffect(() => {
    if (firstPrompt?.text) {
      setCurrentQuestion(firstPrompt.text);
      // Check if we have workings in the database for the original question
      if (firstPrompt.workings) {
        console.log('Original question workings from database:', firstPrompt.workings);
        setCurrentWorkings(firstPrompt.workings);
      } else {
        console.log('No workings found in database for original question');
        setCurrentWorkings(null);
      }
      // Set the answer from database if available
      if (firstPrompt.answer) {
        console.log('Original question answer from database:', firstPrompt.answer);
        setCurrentAnswer(firstPrompt.answer);
      } else {
        console.log('No answer found in database for original question');
        setCurrentAnswer(null);
      }
    }
  }, [firstPrompt?.text, firstPrompt?.workings, firstPrompt?.answer])

  const solveQuestionWithAI = async () => {
    if (!currentQuestion) return;

    // If we already have workings (from database or practice question), use those
    if (currentWorkings) {
      console.log('Using existing workings (from database or practice question)');
      setInterpretedPrompt('workings'); // Use a flag to indicate we're showing workings
      return;
    }

    // Check if this is the original question and we have database workings
    if (firstPrompt?.workings && currentQuestion === firstPrompt.text) {
      console.log('Using database workings for original question:', firstPrompt.workings);
      setCurrentWorkings(firstPrompt.workings);
      setInterpretedPrompt('workings');
      return;
    }

    // Only call API if no workings are available (should mainly be for original questions without workings in DB)
    console.log('No workings available, calling API for solution');
    try {
      setInterpretationLoading(true);
      setInterpretationError(null);
      
      const solution = await deepseekService.solveQuestionWithAI(currentQuestion);
      console.log('Raw solution response from API:', solution);
      
      // Parse the JSON response to extract workings
      let jsonString = solution.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      try {
        const parsedSolution = JSON.parse(jsonString);
        console.log('Parsed API solution:', parsedSolution);
        
        if (parsedSolution.workings) {
          console.log('API generated workings:', parsedSolution.workings);
          console.log('API generated answer:', parsedSolution.answer);
          setCurrentWorkings(parsedSolution.workings);
          setCurrentAnswer(parsedSolution.answer || null);
          setInterpretedPrompt('workings');
        } else {
          console.log('No workings found in API response');
          if (parsedSolution.answer) {
            console.log('API generated answer (no workings):', parsedSolution.answer);
            setCurrentAnswer(parsedSolution.answer);
          }
          setInterpretedPrompt(solution);
        }
      } catch (parseError) {
        console.error('Error parsing API solution response:', parseError);
        console.error('JSON string attempted to parse:', jsonString);
        // Fallback to displaying raw solution
        setInterpretedPrompt(solution);
      }
    } catch (error) {
      console.error('Error calling AI API for solution:', error);
      setInterpretationError(error instanceof Error ? error.message : 'Failed to solve question');
    } finally {
      setInterpretationLoading(false);
    }
  };

  const generatePracticeQuestion = async () => {
    if (!currentQuestion) return;

    try {
      setPracticeQuestionLoading(true);
      setPracticeQuestionError(null);
      
      console.log('Practice again - promptText sent to DeepSeek:', currentQuestion);
      const practiceResponse = await deepseekService.generatePracticeQuestion(currentQuestion);
      console.log('Raw practice response:', practiceResponse);
      
      // Extract JSON from response (remove markdown code blocks if present)
      let jsonString = practiceResponse.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      try {
        const parsedResponse = JSON.parse(jsonString);
        console.log('Parsed response:', parsedResponse);
        
        if (parsedResponse.new_question) {
          setCurrentQuestion(parsedResponse.new_question);
          console.log('Practice question workings:', parsedResponse.workings);
          console.log('Practice question answer:', parsedResponse.answer);
          setCurrentWorkings(parsedResponse.workings || null);
          setCurrentAnswer(parsedResponse.answer || null);
          // Reset form state for new question
          setHasSubmittedAnswer(false);
          setUserAnswer('');
          setInterpretedPrompt(null);
          setInterpretationError(null);
        } else {
          throw new Error('No new question found in response');
        }
      } catch (parseError) {
        console.error('Error parsing practice question response:', parseError);
        console.error('JSON string attempted to parse:', jsonString);
        setPracticeQuestionError('Failed to parse practice question response');
      }
    } catch (error) {
      console.error('Error generating practice question:', error);
      setPracticeQuestionError(error instanceof Error ? error.message : 'Failed to generate practice question');
    } finally {
      setPracticeQuestionLoading(false);
    }
  };

  const generateNextLevelQuestion = async () => {
    if (!currentQuestion) return;

    try {
      setNextLevelLoading(true);
      setNextLevelError(null);
      
      console.log('Next level - promptText sent to DeepSeek:', currentQuestion);
      const nextLevelResponse = await deepseekService.generateNextLevelQuestion(currentQuestion);
      console.log('Raw next level response:', nextLevelResponse);
      
      // Extract JSON from response (remove markdown code blocks if present)
      let jsonString = nextLevelResponse.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      try {
        const parsedResponse = JSON.parse(jsonString);
        console.log('Parsed next level response:', parsedResponse);
        
        if (parsedResponse.new_question) {
          setCurrentQuestion(parsedResponse.new_question);
          console.log('Next level question workings:', parsedResponse.workings);
          console.log('Next level question answer:', parsedResponse.answer);
          setCurrentWorkings(parsedResponse.workings || null);
          setCurrentAnswer(parsedResponse.answer || null);
          // Reset form state for new question
          setHasSubmittedAnswer(false);
          setUserAnswer('');
          setInterpretedPrompt(null);
          setInterpretationError(null);
        } else {
          throw new Error('No new question found in response');
        }
      } catch (parseError) {
        console.error('Error parsing next level question response:', parseError);
        console.error('JSON string attempted to parse:', jsonString);
        setNextLevelError('Failed to parse next level question response');
      }
    } catch (error) {
      console.error('Error generating next level question:', error);
      setNextLevelError(error instanceof Error ? error.message : 'Failed to generate next level question');
    } finally {
      setNextLevelLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'Easy') return 'success'
    if (difficulty === 'Medium') return 'warning'
    return 'danger'
  }

  const renderLatexContent = (content: string) => {
    if (!content) return '';
    
    try {
      // Split content by LaTeX delimiters while preserving them
      // Only support: \( \) for inline, \[ \] and $$ $$ for block
      const parts = content.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/);
      
      return parts.map((part, index) => {
        try {
          // Block math: $$ ... $$ or \[ ... \]
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2);
            return <BlockMath key={index} math={math} />;
          }
          if (part.startsWith('\\[') && part.endsWith('\\]')) {
            const math = part.slice(2, -2);
            return <BlockMath key={index} math={math} />;
          }
          
          // Inline math: only \( ... \)
          if (part.startsWith('\\(') && part.endsWith('\\)')) {
            const math = part.slice(2, -2);
            return <InlineMath key={index} math={math} />;
          }
          
          // Regular text
          return <span key={index}>{part}</span>;
        } catch (latexError) {
          console.warn('LaTeX rendering error for part:', part, latexError);
          // Fallback to displaying raw text
          return <span key={index} style={{ color: '#dc3545', fontFamily: 'monospace' }}>{part}</span>;
        }
      });
    } catch (error) {
      console.warn('LaTeX content parsing error:', error);
      // Fallback to displaying raw content
      return content;
    }
  };

  const renderWorkings = (workings: Working[]) => {
    return workings.map((item, index) => {
      if (item.format === 'title') {
        return (
          <h6 key={index} className="fw-bold mt-3 mb-2">
            {renderLatexContent(item.content)}
          </h6>
        );
      } else if (item.format === 'paragraph') {
        return (
          <div key={index} className="mb-2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {renderLatexContent(item.content)}
          </div>
        );
      }
      return null;
    });
  }

  if (loading) {
    return (
      <Container className="my-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading lesson...</span>
          </div>
          <p className="mt-2 text-muted">Loading lesson...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Lesson</Alert.Heading>
          <p>{error}</p>
          <div>
            <Button variant="outline-danger" onClick={fetchLesson} className="me-2">
              Try Again
            </Button>
            {lesson?.courseId ? (
              <Link to={`/course/${lesson.courseId}`} className="btn btn-secondary">
                Back to Course
              </Link>
            ) : (
              <Link to="/courses" className="btn btn-secondary">
                Back to Courses
              </Link>
            )}
          </div>
        </Alert>
      </Container>
    )
  }

  if (!lesson) {
    return (
      <Container className="my-4">
        <div className="text-center">
          <h2>Lesson not found</h2>
          <p>The lesson you're looking for doesn't exist.</p>
          <Link to="/courses" className="btn btn-primary">
            Back to Courses
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <h1 className="mb-0 me-3">{lesson.title}</h1>
              <Badge bg={getDifficultyColor(lesson.difficulty)}>
                {lesson.difficulty}
              </Badge>
            </div>
          </div>

          <div className="lesson-content">
            <div className="mb-4">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {lesson.content}
              </div>
            </div>
          </div>

          <div className="mt-4 mb-2 d-flex gap-3">
            {firstPrompt && (
              <Button 
                variant="primary" 
                onClick={() => setShowQuestionModal(true)}
                disabled={promptLoading}
              >
                {promptLoading ? 'Loading...' : 'Question'}
              </Button>
            )}
          </div>

          <div> 
            <Link to={`/course/${lesson.courseId}`} className="text-decoration-none">
              Back to Course
            </Link>
          </div>
        </Col>
      </Row>

      {/* Question Modal */}
      <Modal 
        show={showQuestionModal} 
        onHide={() => {
          setShowQuestionModal(false);
          setHasSubmittedAnswer(false);
          setUserAnswer('');
          setInterpretedPrompt(null);
          setInterpretationError(null);
          setPracticeQuestionError(null);
          setNextLevelError(null);
          setCurrentQuestion(firstPrompt?.text || '');
          setCurrentWorkings(null);
          setCurrentAnswer(firstPrompt?.answer || null);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6 className="fw-bold mb-2">Question:</h6>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }} className="p-3 bg-light rounded">
              {renderLatexContent(currentQuestion)}
            </div>
            {practiceQuestionError && (
              <Alert variant="warning" className="mt-2 py-2">
                <small>{practiceQuestionError}</small>
              </Alert>
            )}
            {nextLevelError && (
              <Alert variant="warning" className="mt-2 py-2">
                <small>{nextLevelError}</small>
              </Alert>
            )}
          </div>

          <Form>
            <Form.Group className="mb-4">
              <div className="d-flex align-items-center justify-content-between">
                <Form.Label>Your Answer</Form.Label>
                {hasSubmittedAnswer && (
                  <Badge bg="success" className="ms-2">
                    ✓ Answer Submitted
                  </Badge>
                )}
              </div>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={hasSubmittedAnswer}
              />
            </Form.Group>
          </Form>

          {hasSubmittedAnswer && (
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold mb-0">AI Solution:</h6>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={solveQuestionWithAI}
                  disabled={interpretationLoading || !currentQuestion}
                >
                  {interpretationLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Solving...
                    </>
                  ) : (
                    interpretedPrompt ? 'Get New Solution' : 'Get AI Solution'
                  )}
                </Button>
              </div>
              
              {interpretationError && (
                <Alert variant="warning" className="py-2">
                  <small>{interpretationError}</small>
                </Alert>
              )}
              
              {interpretedPrompt && (
                <div className="p-3 bg-info bg-opacity-10 rounded border-start border-info border-4">
                  {interpretedPrompt === 'workings' && currentWorkings ? (
                    <div>
                      {renderWorkings(currentWorkings)}
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {interpretedPrompt}
                    </div>
                  )}
                </div>
              )}
              
              {!interpretedPrompt && !interpretationError && !interpretationLoading && (
                <div className="text-muted text-center py-3">
                  <small>Click "Get AI Solution" to receive a detailed solution for this question</small>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowQuestionModal(false);
              setHasSubmittedAnswer(false);
              setUserAnswer('');
              setInterpretedPrompt(null);
              setInterpretationError(null);
              setPracticeQuestionError(null);
              setNextLevelError(null);
              setCurrentQuestion(firstPrompt?.text || '');
              setCurrentWorkings(null);
              setCurrentAnswer(firstPrompt?.answer || null);
            }}
          >
            Close
          </Button>
          <Button 
            variant="outline-warning"
            onClick={generatePracticeQuestion}
            disabled={practiceQuestionLoading || !currentQuestion}
          >
            {practiceQuestionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              'Practice again'
            )}
          </Button>
          {!hasSubmittedAnswer ? (
            <Button 
              variant="primary"
              onClick={() => {
                // Mark answer as submitted
                setHasSubmittedAnswer(true);
                console.log('User answer:', userAnswer);
                if (currentAnswer) {
                  console.log('Correct answer:', currentAnswer);
                  console.log('Answer comparison - User:', userAnswer, 'Correct:', currentAnswer);
                } else {
                  console.log('No correct answer available for comparison');
                }
                // Don't close modal - let user see AI solution
              }}
              disabled={!userAnswer.trim()}
            >
              Submit Answer
            </Button>
          ) : (
            <Button 
              variant="success"
              onClick={generateNextLevelQuestion}
              disabled={nextLevelLoading || !currentQuestion}
            >
              {nextLevelLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating...
                </>
              ) : (
                'Next Level'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Lesson
