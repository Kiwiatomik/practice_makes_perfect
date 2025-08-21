import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Accordion from 'react-bootstrap/Accordion'
import { Working } from '../types'
import { InlineMath, BlockMath } from 'react-katex'
import { LATEX_REPLACEMENTS } from '../hooks/useModal'

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

  // Default to equation if answerType is undefined
  const effectiveAnswerType = answerType || 'equation'

  const renderLatexContent = (content: string) => {
    if (!content) return '';
    
    try {
      // Split content by LaTeX delimiters while preserving them
      const parts = content.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/);
      
      // Process each part and collect the results
      const renderedParts: React.ReactNode[] = [];
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Skip empty parts
        if (!part || part.length === 0) continue;
        
        try {
          // Block math: $$ ... $$ or \[ ... \]
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2);
            renderedParts.push(<BlockMath key={i} math={math} />);
          } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
            const math = part.slice(2, -2);
            renderedParts.push(<BlockMath key={i} math={math} />);
          } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
            // Inline math: \( ... \)
            const math = part.slice(2, -2);
            renderedParts.push(<InlineMath key={i} math={math} />);
          } else {
            // Regular text - only add if it's not whitespace only
            const trimmedPart = part.trim();
            if (trimmedPart) {
              renderedParts.push(<span key={i}>{part}</span>);
            }
          }
        } catch (latexError) {
          console.warn('LaTeX rendering error for part:', part, latexError);
          renderedParts.push(<span key={i} style={{ color: '#dc3545', fontFamily: 'monospace' }}>{part}</span>);
        }
      }
      
      return <>{renderedParts}</>;
      
    } catch (error) {
      console.warn('LaTeX content parsing error:', error);
      return content;
    }
  };

  const renderLatexPreview = (content: string) => {
    try {
      // Clean the content - remove any existing LaTeX delimiters
      let cleanContent = content.trim();
      
      // Remove common LaTeX delimiters if user included them
      cleanContent = cleanContent.replace(/^\\\(/, '').replace(/\\\)$/, '');
      cleanContent = cleanContent.replace(/^\$\$?/, '').replace(/\$\$?$/, '');
      cleanContent = cleanContent.replace(/^\\\[/, '').replace(/\\\]$/, '');
      
      // Apply LaTeX command replacements (same as sanitization)
      Object.entries(LATEX_REPLACEMENTS).forEach(([from, to]) => {
        cleanContent = cleanContent.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to)
      })
      
      // Try to render as inline math directly
      return <InlineMath math={cleanContent} />;
    } catch (error) {
      console.warn('LaTeX preview error:', error);
      // Fallback to displaying raw text if LaTeX fails
      return <span style={{ color: '#dc3545', fontFamily: 'monospace' }}>{content}</span>;
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

  return (
    <Modal 
      show={show} 
      onHide={onHide}
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
            {renderLatexContent(questionText)}
          </div>
          {questionGenerationError && (
            <Alert variant="warning" className="mt-2 py-2">
              <small>{questionGenerationError}</small>
            </Alert>
          )}
        </div>

        <Form>
          <Form.Group className="mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <Form.Label>Your Answer</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Badge bg="info" className="text-dark">
                  {effectiveAnswerType === 'number' ? 'Number' : 'Equation'}
                </Badge>
                {hasSubmittedAnswer && (
                  <Badge bg={isCorrect ? "success" : "danger"}>
                    {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                  </Badge>
                )}
              </div>
            </div>
            <Form.Control
              as="textarea"
              rows={effectiveAnswerType === 'number' ? 2 : 4}
              placeholder={
                effectiveAnswerType === 'number' 
                  ? "Enter your numerical answer..." 
                  : "Enter your equation or expression..."
              }
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={hasSubmittedAnswer}
            />
            {effectiveAnswerType === 'equation' && userAnswer.trim() && (
              <div className="mt-2">
                <small className="text-muted">Preview:</small>
                <div className="p-2 bg-light">
                  {renderLatexPreview(userAnswer)} 
                </div>
              </div>
            )}
          </Form.Group>
        </Form>

        {hasSubmittedAnswer && (
          <div className="mb-4">
            <Accordion>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <strong>Solution</strong>
                </Accordion.Header>
                <Accordion.Body>
                  {isLoadingSolution && (
                    <div className="text-center py-3">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading solution...
                    </div>
                  )}
                  
                  {solutionError && (
                    <Alert variant="warning" className="py-2">
                      <small>{solutionError}</small>
                    </Alert>
                  )}
                  
                  {solution && !isLoadingSolution && (
                    <div>
                      {solution === 'workings' && workings ? (
                        <div>
                          {renderWorkings(workings)}
                        </div>
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                          {renderLatexContent(solution)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!solution && !solutionError && !isLoadingSolution && (
                    <div className="text-muted text-center py-3">
                      <small>Solution will be loaded automatically</small>
                    </div>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onHide}
        >
          Close
        </Button>
        <Button 
          variant="outline-warning"
          onClick={() => onGenerateQuestion('practice')}
          disabled={isGeneratingQuestion || !questionText}
        >
          {isGeneratingQuestion ? (
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
            onClick={onSubmitAnswer}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            variant="success"
            onClick={() => onGenerateQuestion('nextLevel')}
            disabled={isGeneratingQuestion || !questionText}
          >
            {isGeneratingQuestion ? (
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
  )
}

export default QuestionModal
