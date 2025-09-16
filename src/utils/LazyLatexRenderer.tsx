import React, { Suspense, lazy } from 'react'
import { Working } from '../types'

// Lazy load the KaTeX components to reduce initial bundle size
const LazyInlineMath = lazy(() => import('react-katex').then(module => ({ default: module.InlineMath })))
const LazyBlockMath = lazy(() => import('react-katex').then(module => ({ default: module.BlockMath })))

// Lazy load the main LatexRenderer
const LazyLatexRenderer = lazy(() => import('./LatexRenderer').then(module => ({ default: module.LatexRenderer })))

// Loading fallback for math rendering
const MathLoadingFallback = ({ content }: { content: string }) => (
  <span 
    className="text-muted font-monospace" 
    style={{ backgroundColor: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}
    title="Loading math..."
  >
    {content}
  </span>
)

export class LazyLatexRendererWrapper {
  /**
   * Renders LaTeX content with lazy-loaded components
   */
  static renderContent(content: string): React.ReactNode {
    if (!content) return ''

    return (
      <Suspense fallback={<MathLoadingFallback content={content} />}>
        <LazyLatexRenderer />
      </Suspense>
    )
  }

  /**
   * Renders LaTeX preview for user input
   */
  static renderPreview(content: string): React.ReactNode {
    if (!content.trim()) return null

    return (
      <Suspense fallback={<MathLoadingFallback content={content} />}>
        <LazyLatexRenderer />
      </Suspense>
    )
  }

  /**
   * Renders working steps
   */
  static renderWorkings(workings: Working[]): React.ReactNode {
    if (!workings || workings.length === 0) return null

    return (
      <Suspense fallback={<div className="text-muted">Loading solution steps...</div>}>
        <LazyLatexRenderer />
      </Suspense>
    )
  }
}

// Direct KaTeX component wrappers for when we need them specifically
export const LazyInlineMathComponent = ({ math }: { math: string }) => (
  <Suspense fallback={<MathLoadingFallback content={`$${math}$`} />}>
    <LazyInlineMath math={math} />
  </Suspense>
)

export const LazyBlockMathComponent = ({ math }: { math: string }) => (
  <Suspense fallback={<MathLoadingFallback content={`$$${math}$$`} />}>
    <LazyBlockMath math={math} />
  </Suspense>
)

export default LazyLatexRendererWrapper