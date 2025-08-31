import React from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import { Working } from '../types'
import { LATEX_REPLACEMENTS } from '../hooks/useModal'

export class LatexRenderer {
  /**
   * Renders LaTeX content with mixed text and math expressions
   */
  static renderContent(content: string): React.ReactNode {
    if (!content) return ''

    try {
      // Split content by LaTeX delimiters while preserving them
      const parts = content.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/)
      
      // Process each part and collect the results
      const renderedParts: React.ReactNode[] = []
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        
        // Skip empty parts
        if (!part || part.length === 0) continue
        
        try {
          // Block math: $$ ... $$ or \[ ... \]
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2)
            renderedParts.push(<BlockMath key={i} math={math} />)
          } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
            const math = part.slice(2, -2)
            renderedParts.push(<BlockMath key={i} math={math} />)
          } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
            // Inline math: \( ... \)
            const math = part.slice(2, -2)
            renderedParts.push(<InlineMath key={i} math={math} />)
          } else {
            // Regular text - only add if it's not whitespace only
            const trimmedPart = part.trim()
            if (trimmedPart) {
              renderedParts.push(<span key={i}>{part}</span>)
            }
          }
        } catch (latexError) {
          console.warn('LaTeX rendering error for part:', part, latexError)
          renderedParts.push(
            <span key={i} style={{ color: '#dc3545', fontFamily: 'monospace' }}>
              {part}
            </span>
          )
        }
      }
      
      return <>{renderedParts}</>
      
    } catch (error) {
      console.warn('LaTeX content parsing error:', error)
      return content
    }
  }

  /**
   * Renders LaTeX preview for user input with cleaning and formatting
   */
  static renderPreview(content: string): React.ReactNode {
    try {
      // Clean the content - remove any existing LaTeX delimiters
      let cleanContent = content.trim()
      
      // Remove common LaTeX delimiters if user included them
      cleanContent = cleanContent.replace(/^\\\(/, '').replace(/\\\)$/, '')
      cleanContent = cleanContent.replace(/^\$\$?/, '').replace(/\$\$?$/, '')
      cleanContent = cleanContent.replace(/^\\\[/, '').replace(/\\\]$/, '')
      
      // Apply LaTeX command replacements (same as sanitization)
      Object.entries(LATEX_REPLACEMENTS).forEach(([from, to]) => {
        cleanContent = cleanContent.replace(
          new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
          to
        )
      })
      
      // Add displaystyle for sums and integrals to show bounds above/below
      if (cleanContent.includes('\\sum') || cleanContent.includes('\\int')) {
        cleanContent = '\\displaystyle ' + cleanContent
      }
      
      // Check if content should be rendered as block math (contains display-style elements)
      const hasBlockElements = /\\(sum|int|frac|sqrt)/.test(cleanContent)
      
      if (hasBlockElements) {
        return <BlockMath math={cleanContent} />
      } else {
        return <InlineMath math={cleanContent} />
      }
    } catch (error) {
      console.warn('LaTeX preview error:', error)
      // Fallback to displaying raw text if LaTeX fails
      return <span style={{ color: '#dc3545', fontFamily: 'monospace' }}>{content}</span>
    }
  }

  /**
   * Renders working steps with proper formatting
   */
  static renderWorkings(workings: Working[]): React.ReactNode {
    return workings.map((item, index) => {
      if (item.format === 'title') {
        return (
          <h6 key={index} className="fw-bold mt-3 mb-2">
            {this.renderContent(item.content)}
          </h6>
        )
      } else if (item.format === 'paragraph') {
        return (
          <div key={index} className="mb-2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {this.renderContent(item.content)}
          </div>
        )
      }
      return null
    })
  }
}