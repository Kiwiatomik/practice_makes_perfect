import Button from 'react-bootstrap/Button'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'

interface LatexHelperButtonsProps {
  onInsert: (latex: string) => void
}

interface LatexButton {
  symbol: string
  latex: string
  tooltip: string
}

const latexButtons: LatexButton[] = [
  { symbol: '≤', latex: '\\leq ', tooltip: 'Less than or equal to' },
  { symbol: '≥', latex: '\\geq ', tooltip: 'Greater than or equal to' },
  { symbol: '≠', latex: '\\neq ', tooltip: 'Not equal to' },
  { symbol: '±', latex: '\\pm ', tooltip: 'Plus or minus' },
  // { symbol: '∞', latex: '\\infty ', tooltip: 'Infinity' },
  // { symbol: 'π', latex: '\\pi ', tooltip: 'Pi' },
  { symbol: '√x', latex: '\\sqrt{x} ', tooltip: 'Square root' },
  { symbol: 'x²', latex: 'x^{2} ', tooltip: 'Superscript (power)' },
  { symbol: 'x₁', latex: 'x_{1} ', tooltip: 'Subscript' },
  // { symbol: '∫', latex: '\\int_{0}^{+\\infty} f(x) dx ', tooltip: 'Integral' },
  // { symbol: '∑', latex: '\\\sum_{i = 0}^{+\\infty} x_{i} ', tooltip: 'Sum' },
  // { symbol: 'd/dx', latex: '\\frac{df(x)}{dx} ', tooltip: 'Derivative' },
  { symbol: '1/x', latex: '\\frac{1}{x} ', tooltip: 'Fraction' }
]

function LatexHelperButtons({ onInsert }: LatexHelperButtonsProps) {
  return (
    <div className="mb-2" role="toolbar" aria-label="LaTeX symbol insertion tools">
      <small className="text-muted d-block mb-2">LaTeX Helpers:</small>
      <div className="d-flex flex-wrap gap-1" role="group" aria-label="LaTeX symbol buttons">
        {latexButtons.map((button, index) => (
          <OverlayTrigger
            key={index}
            placement="top"
            overlay={<Tooltip>{button.tooltip}</Tooltip>}
          >
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onInsert(button.latex)}
              className="px-2 py-1"
              style={{ fontSize: '0.75rem', minWidth: '32px' }}
              aria-label={`Insert ${button.tooltip}`}
              tabIndex={0}
            >
              {button.symbol}
            </Button>
          </OverlayTrigger>
        ))}
      </div>
    </div>
  )
}

export default LatexHelperButtons
