import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import { coursesService } from '../services/coursesService';
import { Prompt, Lesson, Course } from '../types';

const AdminQuestionPopulator = () => {
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);

  // Sample mathematics questions with LaTeX formatting
  const sampleMathQuestions: Omit<Prompt, 'id' | 'createdAt'>[] = [
    {
      text: "Find the derivative of \\( f(x) = 2x^3 + 5x^2 - 3x + 1 \\)",
      abstractionLevel: 0,
      difficulty: "Easy",
      level: "Bachelor",
      answer: "\\( f'(x) = 6x^2 + 10x - 3 \\)",
      answerType: "equation",
      workings: [
        {
          format: "title",
          content: "Solution: Finding the derivative using the power rule"
        },
        {
          format: "paragraph",
          content: "We'll use the power rule: \\( \\frac{d}{dx}[x^n] = nx^{n-1} \\)"
        },
        {
          format: "paragraph",
          content: "For \\( f(x) = 2x^3 + 5x^2 - 3x + 1 \\):"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[2x^3] = 2 \\cdot 3x^{3-1} = 6x^2 \\)"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[5x^2] = 5 \\cdot 2x^{2-1} = 10x \\)"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[-3x] = -3 \\cdot 1x^{1-1} = -3 \\)"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[1] = 0 \\) (derivative of constant is zero)"
        },
        {
          format: "paragraph",
          content: "Therefore: \\( f'(x) = 6x^2 + 10x - 3 \\)"
        }
      ]
    },
    {
      text: "Find the derivative of \\( g(x) = x^4 - 2x^3 + 7x - 5 \\)",
      abstractionLevel: 0,
      difficulty: "Easy",
      level: "Bachelor",
      answer: "\\( g'(x) = 4x^3 - 6x^2 + 7 \\)",
      answerType: "equation",
      workings: [
        {
          format: "title",
          content: "Solution: Finding the derivative using the power rule"
        },
        {
          format: "paragraph",
          content: "Using the power rule \\( \\frac{d}{dx}[x^n] = nx^{n-1} \\) for each term:"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[x^4] = 4x^3 \\)"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[-2x^3] = -2 \\cdot 3x^2 = -6x^2 \\)"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[7x] = 7 \\)"
        },
        {
          format: "paragraph",
          content: "\\( \\frac{d}{dx}[-5] = 0 \\)"
        },
        {
          format: "paragraph",
          content: "Therefore: \\( g'(x) = 4x^3 - 6x^2 + 7 \\)"
        }
      ]
    },
    {
      text: "Use the product rule to find the derivative of \\( h(x) = (2x + 1)(x^2 - 3) \\)",
      abstractionLevel: 0,
      difficulty: "Medium",
      level: "Bachelor",
      answer: "\\( h'(x) = 6x^2 + 2x - 6 \\)",
      answerType: "equation",
      workings: [
        {
          format: "title",
          content: "Solution: Using the product rule"
        },
        {
          format: "paragraph",
          content: "The product rule states: \\( (fg)' = f'g + fg' \\)"
        },
        {
          format: "paragraph",
          content: "Let \\( f(x) = 2x + 1 \\) and \\( g(x) = x^2 - 3 \\)"
        },
        {
          format: "paragraph",
          content: "Find the derivatives: \\( f'(x) = 2 \\), \\( g'(x) = 2x \\)"
        },
        {
          format: "paragraph",
          content: "Apply the product rule: \\( h'(x) = 2(x^2 - 3) + (2x + 1)(2x) \\)"
        },
        {
          format: "paragraph",
          content: "\\( h'(x) = 2x^2 - 6 + 4x^2 + 2x = 6x^2 + 2x - 6 \\)"
        }
      ]
    },
    {
      text: "Solve the quadratic equation \\( x^2 - 5x + 6 = 0 \\)",
      abstractionLevel: 0,
      difficulty: "Easy",
      level: "High school",
      answer: "\\( x = 2 \\) or \\( x = 3 \\)",
      answerType: "equation",
      workings: [
        {
          format: "title",
          content: "Solution: Solving by factoring"
        },
        {
          format: "paragraph",
          content: "We need to factor \\( x^2 - 5x + 6 \\)"
        },
        {
          format: "paragraph",
          content: "Look for two numbers that multiply to 6 and add to -5: -2 and -3"
        },
        {
          format: "paragraph",
          content: "So: \\( x^2 - 5x + 6 = (x - 2)(x - 3) = 0 \\)"
        },
        {
          format: "paragraph",
          content: "Therefore: \\( x = 2 \\) or \\( x = 3 \\)"
        }
      ]
    },
    {
      text: "What is the value of \\( \\frac{d}{dx}[x^3] \\) at \\( x = 2 \\)?",
      abstractionLevel: 0,
      difficulty: "Easy",
      level: "High school",
      answer: "12",
      answerType: "number",
      workings: [
        {
          format: "title",
          content: "Solution: Evaluating the derivative at a point"
        },
        {
          format: "paragraph",
          content: "First, find the derivative: \\( \\frac{d}{dx}[x^3] = 3x^2 \\)"
        },
        {
          format: "paragraph",
          content: "Then substitute \\( x = 2 \\): \\( 3(2)^2 = 3 \\times 4 = 12 \\)"
        }
      ]
    }
  ];

  const sampleProgrammingQuestions: Omit<Prompt, 'id' | 'createdAt'>[] = [
    {
      text: "Write a Python function that returns the factorial of a given positive integer n.",
      abstractionLevel: 0,
      difficulty: "Easy",
      level: "High school",
      answer: "```python\ndef factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)\n```",
      workings: [
        {
          format: "title",
          content: "Solution: Recursive factorial function"
        },
        {
          format: "paragraph",
          content: "The factorial of a number n (written as n!) is the product of all positive integers from 1 to n."
        },
        {
          format: "paragraph",
          content: "Base cases: 0! = 1 and 1! = 1"
        },
        {
          format: "paragraph",
          content: "Recursive case: n! = n × (n-1)!"
        },
        {
          format: "paragraph",
          content: "```python\ndef factorial(n):\n    # Base cases\n    if n == 0 or n == 1:\n        return 1\n    # Recursive case\n    return n * factorial(n - 1)\n```"
        }
      ]
    },
    {
      text: "Implement a function to check if a given string is a palindrome (reads the same forwards and backwards).",
      abstractionLevel: 0,
      difficulty: "Easy",
      level: "High school",
      answer: "```python\ndef is_palindrome(s):\n    # Convert to lowercase and remove spaces\n    s = s.lower().replace(' ', '')\n    return s == s[::-1]\n```",
      workings: [
        {
          format: "title",
          content: "Solution: Palindrome checker"
        },
        {
          format: "paragraph",
          content: "A palindrome reads the same forwards and backwards (e.g., 'racecar', 'A man a plan a canal Panama')."
        },
        {
          format: "paragraph",
          content: "Steps:\n1. Normalize the string (lowercase, remove spaces)\n2. Compare with its reverse"
        },
        {
          format: "paragraph",
          content: "```python\ndef is_palindrome(s):\n    # Normalize: convert to lowercase and remove spaces\n    s = s.lower().replace(' ', '')\n    # Compare string with its reverse\n    return s == s[::-1]\n```"
        }
      ]
    }
  ];

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      setError(null);
      
      const coursesList = await coursesService.getAllCourses();
      
      // Load lessons for each course
      const coursesWithLessons = await Promise.all(
        coursesList.map(async (course) => {
          try {
            const lessons = await coursesService.getLessonsByCourseId(course.id);
            return { ...course, lessons };
          } catch (error) {
            console.warn(`Could not load lessons for course ${course.id}:`, error);
            return { ...course, lessons: [] };
          }
        })
      );
      
      setCourses(coursesWithLessons);
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const populateQuestions = async (questions: Omit<Prompt, 'id' | 'createdAt'>[], type: string) => {
    if (!courseId || !lessonId) {
      setError('Please select both a course and lesson');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('Creating prompts with:', { courseId, lessonId, questionCount: questions.length });
      console.log('First question sample:', questions[0]);
      
      const promptIds = await coursesService.createMultiplePrompts(courseId, lessonId, questions);
      setSuccess(`Successfully added ${questions.length} ${type} questions! IDs: ${promptIds.join(', ')}`);
    } catch (err) {
      console.error('Error creating prompts:', err);
      const errorMessage = err instanceof Error ? err.message : `Failed to add ${type} questions`;
      setError(`${errorMessage}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <h2>Admin: Question Populator</h2>
          
          <Card className="mb-4">
            <Card.Header>
              <h5>Course and Lesson Selection</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col>
                  <Button 
                    variant="outline-primary" 
                    onClick={loadCourses} 
                    className="me-2"
                    disabled={coursesLoading}
                  >
                    {coursesLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                      </>
                    ) : (
                      'Load Courses'
                    )}
                  </Button>
                  {courses.length > 0 && !coursesLoading && (
                    <span className="text-success">✓ {courses.length} courses loaded</span>
                  )}
                </Col>
              </Row>

              {courses.length > 0 && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Course</Form.Label>
                    <Form.Select 
                      value={courseId} 
                      onChange={(e) => {
                        setCourseId(e.target.value);
                        setLessonId(''); // Reset lesson selection when course changes
                      }}
                    >
                      <option value="">Choose a course...</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title} ({course.subject} - {course.level})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {courseId && (
                    <Form.Group className="mb-3">
                      <Form.Label>Select Lesson</Form.Label>
                      <Form.Select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
                        <option value="">Choose a lesson...</option>
                        {courses.find(c => c.id === courseId)?.lessons.map((lesson: Lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title} ({lesson.difficulty})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                </>
              )}
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-3">
              {success}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Mathematics Questions</h5>
                </Card.Header>
                <Card.Body>
                  <p>Add {sampleMathQuestions.length} calculus and algebra questions with LaTeX formatting:</p>
                  <ul>
                    <li>Derivative problems (power rule, product rule)</li>
                    <li>Quadratic equation solving</li>
                    <li>Complete step-by-step solutions</li>
                  </ul>
                  <Button 
                    variant="primary" 
                    onClick={() => populateQuestions(sampleMathQuestions, 'mathematics')}
                    disabled={loading || !courseId || !lessonId}
                  >
                    {loading ? 'Adding...' : 'Add Math Questions'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="mb-4">
                <Card.Header>
                  <h5>Programming Questions</h5>
                </Card.Header>
                <Card.Body>
                  <p>Add {sampleProgrammingQuestions.length} Python programming questions:</p>
                  <ul>
                    <li>Factorial function (recursion)</li>
                    <li>Palindrome checker (string manipulation)</li>
                    <li>Code examples with explanations</li>
                  </ul>
                  <Button 
                    variant="success" 
                    onClick={() => populateQuestions(sampleProgrammingQuestions, 'programming')}
                    disabled={loading || !courseId || !lessonId}
                  >
                    {loading ? 'Adding...' : 'Add Programming Questions'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Alert variant="info">
            <Alert.Heading>Instructions</Alert.Heading>
            <ol>
              <li>Click "Load Courses" to fetch available courses from the database</li>
              <li>Select a course and lesson where you want to add questions</li>
              <li>Choose which type of questions to add (Math or Programming)</li>
              <li>Questions will be added with abstractionLevel = 0 (original questions)</li>
              <li>Each question includes complete workings and LaTeX formatting where applicable</li>
            </ol>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminQuestionPopulator;