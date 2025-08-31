import Alert from 'react-bootstrap/Alert'
import Accordion from 'react-bootstrap/Accordion'
import { Working } from '../types'
import { LatexRenderer } from '../utils/LatexRenderer'

interface SolutionSectionProps {
  hasSubmittedAnswer: boolean
  isLoadingSolution: boolean
  solutionError: string | null
  solution: string | null
  workings: Working[] | null
}

function SolutionSection({
  hasSubmittedAnswer,
  isLoadingSolution,
  solutionError,
  solution,
  workings
}: SolutionSectionProps) {
  if (!hasSubmittedAnswer) {
    return null
  }

  return (
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
                    {LatexRenderer.renderWorkings(workings)}
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {LatexRenderer.renderContent(solution)}
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
  )
}

export default SolutionSection