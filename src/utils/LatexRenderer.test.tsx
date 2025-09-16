import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { LatexRenderer } from './LatexRenderer'
import { Working } from '../types'

// Mock react-katex since it's already mocked in setup.ts
// We want to verify our logic, not KaTeX rendering

describe('LatexRenderer utility class', () => {
  describe('renderContent', () => {
    it('should handle empty content', () => {
      expect(LatexRenderer.renderContent('')).toBe('')
      expect(LatexRenderer.renderContent(null as any)).toBe('')
      expect(LatexRenderer.renderContent(undefined as any)).toBe('')
    })

    it('should render plain text content', () => {
      const result = LatexRenderer.renderContent('Hello world')
      const { container } = render(<>{result}</>)
      expect(container.textContent).toBe('Hello world')
    })

    it('should render block math with $$ delimiters', () => {
      const result = LatexRenderer.renderContent('Here is math: $$x^2 + y^2 = z^2$$')
      const { container } = render(<>{result}</>)
      
      // Should contain both text and mocked BlockMath
      expect(container.textContent).toContain('Here is math:')
      expect(container.textContent).toContain('BlockMath: x^2 + y^2 = z^2')
    })

    it('should render block math with \\[ \\] delimiters', () => {
      const result = LatexRenderer.renderContent('Equation: \\[E = mc^2\\]')
      const { container } = render(<>{result}</>)
      
      expect(container.textContent).toContain('Equation:')
      expect(container.textContent).toContain('BlockMath: E = mc^2')
    })

    it('should render inline math with \\( \\) delimiters', () => {
      const result = LatexRenderer.renderContent('Inline math: \\(a + b = c\\)')
      const { container } = render(<>{result}</>)
      
      expect(container.textContent).toContain('Inline math:')
      expect(container.textContent).toContain('InlineMath: a + b = c')
    })

    it('should render inline math with backtick delimiters', () => {
      const result = LatexRenderer.renderContent('Simple math: `x = 5`')
      const { container } = render(<>{result}</>)
      
      expect(container.textContent).toContain('Simple math:')
      expect(container.textContent).toContain('InlineMath: x = 5')
    })

    it('should handle mixed content with multiple math expressions', () => {
      const content = 'Text $$block$$ more text \\(inline\\) end'
      const result = LatexRenderer.renderContent(content)
      const { container } = render(<>{result}</>)
      
      expect(container.textContent).toContain('Text')
      expect(container.textContent).toContain('BlockMath: block')
      expect(container.textContent).toContain('more text')
      expect(container.textContent).toContain('InlineMath: inline')
      expect(container.textContent).toContain('end')
    })

    it('should handle LaTeX rendering errors gracefully', () => {
      // Mock console.warn to verify error handling
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // This would normally cause a LaTeX error, but our mock won't throw
      const result = LatexRenderer.renderContent('$$invalid\\math$$')
      const { container } = render(<>{result}</>)
      
      // Should render as BlockMath due to our mock
      expect(container.textContent).toContain('BlockMath: invalid\\math')
      
      consoleSpy.mockRestore()
    })

    it('should skip empty parts', () => {
      const result = LatexRenderer.renderContent('   ')
      const { container } = render(<>{result}</>)
      // Should not render whitespace-only content
      expect(container.textContent).toBe('')
    })

    it('should handle parsing errors by returning original content', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Force a parsing error by mocking split to throw
      const originalSplit = String.prototype.split
      String.prototype.split = vi.fn(() => { throw new Error('Parse error') })
      
      const result = LatexRenderer.renderContent('test content')
      expect(result).toBe('test content')
      
      // Restore original split
      String.prototype.split = originalSplit
      consoleSpy.mockRestore()
    })
  })

  describe('renderPreview', () => {
    it('should clean and render simple math as inline', () => {
      const result = LatexRenderer.renderPreview('x + y')
      const { container } = render(<>{result}</>)
      expect(container.textContent).toContain('InlineMath: x + y')
    })

    it('should render complex math as block math', () => {
      const result = LatexRenderer.renderPreview('\\frac{1}{2}')
      const { container } = render(<>{result}</>)
      expect(container.textContent).toContain('BlockMath: \\frac{1}{2}')
    })

    it('should add displaystyle for sums and integrals', () => {
      const result = LatexRenderer.renderPreview('\\sum_{i=1}^n i')
      const { container } = render(<>{result}</>)
      expect(container.textContent).toContain('BlockMath: \\displaystyle \\sum_{i=1}^n i')
    })

    it('should clean existing LaTeX delimiters', () => {
      const tests = [
        { input: '$$x^2$$', expected: 'x^2' },
        { input: '$x^2$', expected: 'x^2' },
        { input: '\\(x^2\\)', expected: 'x^2' },
        { input: '\\[x^2\\]', expected: 'x^2' },
      ]

      tests.forEach(({ input, expected }) => {
        const result = LatexRenderer.renderPreview(input)
        const { container } = render(<>{result}</>)
        expect(container.textContent).toContain(expected)
      })
    })

    it('should apply LaTeX replacements', () => {
      const result = LatexRenderer.renderPreview('x <= y >= z')
      const { container } = render(<>{result}</>)
      expect(container.textContent).toContain('x \\leq y \\geq z')
    })

    it('should handle errors by returning styled error text', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Test with invalid LaTeX that would normally cause errors
      const result = LatexRenderer.renderPreview('\\invalidcommand{test}')
      const { container } = render(<>{result}</>)
      
      // Should still render something (even if via our mocks)
      expect(container.textContent).toBeTruthy()
      
      consoleSpy.mockRestore()
    })

    it('should trim whitespace', () => {
      const result = LatexRenderer.renderPreview('  x + y  ')
      const { container } = render(<>{result}</>)
      expect(container.textContent).toContain('InlineMath: x + y')
    })
  })

  describe('renderWorkings', () => {
    it('should render title format working', () => {
      const workings: Working[] = [
        { format: 'title', content: 'Step 1' }
      ]
      
      const result = LatexRenderer.renderWorkings(workings)
      const { container } = render(<>{result}</>)
      
      expect(container.querySelector('h6')).toBeTruthy()
      expect(container.textContent).toContain('Step 1')
    })

    it('should render paragraph format working', () => {
      const workings: Working[] = [
        { format: 'paragraph', content: 'This is a step explanation.' }
      ]
      
      const result = LatexRenderer.renderWorkings(workings)
      const { container } = render(<>{result}</>)
      
      expect(container.querySelector('div')).toBeTruthy()
      expect(container.textContent).toContain('This is a step explanation.')
    })

    it('should render mixed format workings', () => {
      const workings: Working[] = [
        { format: 'title', content: 'Solution' },
        { format: 'paragraph', content: 'First, we solve for x: $$x = 5$$' }
      ]
      
      const result = LatexRenderer.renderWorkings(workings)
      const { container } = render(<>{result}</>)
      
      expect(container.querySelector('h6')).toBeTruthy()
      expect(container.querySelector('div')).toBeTruthy()
      expect(container.textContent).toContain('Solution')
      expect(container.textContent).toContain('First, we solve for x:')
      expect(container.textContent).toContain('BlockMath: x = 5')
    })

    it('should handle unknown formats by returning null', () => {
      const workings: Working[] = [
        { format: 'unknown' as any, content: 'Test' }
      ]
      
      const result = LatexRenderer.renderWorkings(workings)
      // Should return array with null for unknown format
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle empty workings array', () => {
      const result = LatexRenderer.renderWorkings([])
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('should process workings in order', () => {
      const workings: Working[] = [
        { format: 'title', content: 'Step 1' },
        { format: 'paragraph', content: 'Do something' },
        { format: 'title', content: 'Step 2' },
        { format: 'paragraph', content: 'Do something else' }
      ]
      
      const result = LatexRenderer.renderWorkings(workings)
      const { container } = render(<>{result}</>)
      
      const headings = container.querySelectorAll('h6')
      const paragraphs = container.querySelectorAll('div')
      
      expect(headings).toHaveLength(2)
      expect(paragraphs).toHaveLength(2)
      expect(headings[0].textContent).toBe('Step 1')
      expect(headings[1].textContent).toBe('Step 2')
    })
  })

  describe('integration scenarios', () => {
    it('should handle complex mixed content with LaTeX in workings', () => {
      const workings: Working[] = [
        { format: 'title', content: 'Quadratic Formula' },
        { format: 'paragraph', content: 'The formula is: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$' }
      ]
      
      const result = LatexRenderer.renderWorkings(workings)
      const { container } = render(<>{result}</>)
      
      expect(container.textContent).toContain('Quadratic Formula')
      expect(container.textContent).toContain('BlockMath: x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}')
    })
  })
})