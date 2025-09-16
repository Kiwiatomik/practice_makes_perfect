import { describe, it, expect } from 'vitest'

describe('Test Setup Verification', () => {
  it('should have access to testing globals', () => {
    expect(expect).toBeDefined()
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
  })

  it('should have jest-dom matchers available', () => {
    const element = document.createElement('div')
    element.textContent = 'Hello World'
    document.body.appendChild(element)
    
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello World')
    
    document.body.removeChild(element)
  })

  it('should have jsdom environment', () => {
    expect(document).toBeDefined()
    expect(window).toBeDefined()
    expect(global.document).toBeDefined()
  })
})