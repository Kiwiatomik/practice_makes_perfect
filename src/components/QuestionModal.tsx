import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import { Working } from '../types'
import LatexHelperButtons from './LatexHelperButtons'
import SolutionSection from './SolutionSection'
import { LatexRenderer } from '../utils/LatexRenderer'
import { useRef, useState, useEffect } from 'react'

interface QuestionModalProps {
  show: boolean
  onHide: () => void
  questionText: string
  answerType?: 'number' | 'equation'
  questionGenerationError: string | null
  userAnswer: string
  hasSubmittedAnswer: boolean
  isCorrect: boolean
  onAnswerChange: (value: string) => void
  onSubmitAnswer: () => void
  onGenerateQuestion: (type: 'practice' | 'nextLevel') => void
  onGetSolution: () => void
  isGeneratingQuestion: boolean
  isLoadingSolution: boolean
  solutionError: string | null
  solution: string | null
  workings: Working[] | null
}

function QuestionModal({
  show,
  onHide,
  questionText,
  answerType,
  questionGenerationError,
  userAnswer,
  hasSubmittedAnswer,
  isCorrect,
  onAnswerChange,
  onSubmitAnswer,
  onGenerateQuestion,
  onGetSolution,
  isGeneratingQuestion,
  isLoadingSolution,
  solutionError,
  solution,
  workings
}: QuestionModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [debouncedUserAnswer, setDebouncedUserAnswer] = useState(userAnswer)

  // Default to equation if answerType is undefined
  const effectiveAnswerType = answerType || 'equation'

  // Debounce the user answer for LaTeX preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserAnswer(userAnswer)
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timer)
  }, [userAnswer])

  const handleLatexInsert = (latex: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = userAnswer

    // Insert the LaTeX command at cursor position
    const newValue = currentValue.slice(0, start) + latex + currentValue.slice(end)
    onAnswerChange(newValue)

    // Set cursor position after the inserted text
    setTimeout(() => {
      if (latex.includes('{}')) {
        // If the command includes braces, position cursor inside them
        const bracePosition = start + latex.indexOf('{}')
        textarea.setSelectionRange(bracePosition, bracePosition)
      } else {
        // Otherwise, position at the end of the inserted text
        textarea.setSelectionRange(start + latex.length, start + latex.length)
      }
      textarea.focus()
    }, 0)
  }




  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      aria-labelledby="question-modal-title"
      aria-describedby="question-modal-description"
    >
      <Modal.Header closeButton>
        <Modal.Title id="question-modal-title">Question</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4" id="question-modal-description">
          <h6 className="fw-bold mb-2" id="question-text-label">Question:</h6>
          <div 
            style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }} 
            className="question-display-bg rounded"
            role="article"
            aria-labelledby="question-text-label"
          >
            {LatexRenderer.renderContent(questionText)}
          </div>
          {questionGenerationError && (
            <Alert variant="warning" className="mt-2 py-2" role="alert">
              <small>{questionGenerationError}</small>
            </Alert>
          )}
        </div>

        <Form role="form" aria-label="Answer submission form">
          <Form.Group className="mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <Form.Label htmlFor="user-answer-input" id="answer-label">Your Answer</Form.Label>
              <div className="d-flex align-items-center gap-2">
                {hasSubmittedAnswer && (
                  <Badge 
                    bg={isCorrect ? "success" : "danger"}
                    aria-label={`Answer status: ${isCorrect ? 'Correct' : 'Incorrect'}`}
                  >
                    {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                  </Badge>
                )}
              </div>
            </div>
            {effectiveAnswerType === 'equation' && !hasSubmittedAnswer && (
              <div role="toolbar" aria-label="LaTeX symbol insertion tools">
                <LatexHelperButtons onInsert={handleLatexInsert} />
              </div>
            )}
            <Form.Control
              as="textarea"
              id="user-answer-input"
              ref={textareaRef}
              rows={effectiveAnswerType === 'number' ? 2 : 4}
              placeholder={
                effectiveAnswerType === 'number' 
                  ? "Enter your numerical answer..." 
                  : "Enter your equation or expression..."
              }
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={hasSubmittedAnswer}
              aria-labelledby="answer-label"
              aria-describedby={effectiveAnswerType === 'equation' && debouncedUserAnswer.trim() ? "latex-preview" : undefined}
            />
            {effectiveAnswerType === 'equation' && debouncedUserAnswer.trim() && (
              <div className="mt-2" id="latex-preview" role="region" aria-live="polite">
                <small className="text-muted">Preview:</small>
                <div 
                  className="question-display-bg rounded"
                  aria-label={`LaTeX preview of your equation: ${debouncedUserAnswer}`}
                >
                  {LatexRenderer.renderPreview(debouncedUserAnswer)}
                </div>
              </div>
            )}
          </Form.Group>
        </Form>

        <SolutionSection
          hasSubmittedAnswer={hasSubmittedAnswer}
          isLoadingSolution={isLoadingSolution}
          solutionError={solutionError}
          solution={solution}
          workings={workings}
        />
      </Modal.Body>
      <Modal.Footer role="toolbar" aria-label="Modal actions">
        <Button 
          variant="outline-warning"
          onClick={() => onGenerateQuestion('practice')}
          disabled={isGeneratingQuestion || !questionText}
          aria-label="Generate a new practice question with different values"
          aria-describedby={isGeneratingQuestion ? "generating-status" : undefined}
        >
          {isGeneratingQuestion ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <span id="generating-status">Generating...</span>
            </>
          ) : (
            'Another question'
          )}
        </Button>
        {!hasSubmittedAnswer ? (
          <Button 
            variant="primary"
            onClick={onSubmitAnswer}
            disabled={!userAnswer.trim()}
            aria-label="Submit your answer for evaluation"
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            variant="success"
            onClick={() => onGenerateQuestion('nextLevel')}
            disabled={isGeneratingQuestion || !questionText}
            aria-label="Generate a more challenging question with increased abstraction"
            aria-describedby={isGeneratingQuestion ? "generating-status" : undefined}
          >
            {isGeneratingQuestion ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                <span>Generating...</span>
              </>
            ) : (
              'Next Level'
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default QuestionModal
