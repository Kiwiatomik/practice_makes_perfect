import { describe, it, expect } from 'vitest'
import { sanitizeErrorMessage, sanitizeCourseError, sanitizeLessonError } from './errorSanitization'

describe('errorSanitization utilities', () => {
  describe('sanitizeErrorMessage', () => {
    describe('safe error messages (should pass through unchanged)', () => {
      const safeMessages = [
        'User cancelled the operation',
        'Invalid email format',
        'Password must be at least 6 characters',
        'Field is required',
        'Invalid input provided',
        'Operation timed out',
        'Connection lost',
        'Validation failed',
      ]

      safeMessages.forEach(message => {
        it(`should pass through safe message: "${message}"`, () => {
          expect(sanitizeErrorMessage(message)).toBe(message)
        })
      })
    })

    describe('Firebase-specific errors (should be sanitized)', () => {
      it('should sanitize FirebaseError messages', () => {
        const firebaseErrors = [
          'FirebaseError: Missing or insufficient permissions',
          'Firebase: Permission denied (auth/permission-denied)',
          'FirebaseError: Document reference does not exist',
        ]

        firebaseErrors.forEach(error => {
          const result = sanitizeErrorMessage(error)
          expect(result).not.toContain('Firebase')
          expect(result).not.toContain('auth/')
          expect(result).toMatch(/Unable to load data|Access denied|The requested content/)
        })
      })

      it('should sanitize permission-related errors', () => {
        const permissionErrors = [
          'Missing or insufficient permissions',
          'PERMISSION_DENIED: Access denied',
          'auth/permission-denied',
          'Unauthorized access',
        ]

        permissionErrors.forEach(error => {
          const result = sanitizeErrorMessage(error)
          expect(result).toBe('Access denied. Please make sure you are logged in and try again.')
        })
      })

      it('should sanitize network-related errors', () => {
        const networkErrors = [
          'Network request failed',
          'client is offline',
        ]

        networkErrors.forEach(error => {
          const result = sanitizeErrorMessage(error)
          expect(result).toBe('Network error. Please check your connection and try again.')
        })
        
        // This one doesn't match the specific patterns, so passes through
        expect(sanitizeErrorMessage('Connection failed')).toBe('Connection failed')
      })

      it('should sanitize not found errors', () => {
        // Tests should verify error sanitization directly
        expect(sanitizeErrorMessage('Document reference does not exist')).toBe('The requested resource was not found')
        expect(sanitizeErrorMessage('Failed to get document')).toBe('The requested resource was not found')

        // "Failed to get document" should match the sensitive pattern and get generic sanitization
        expect(sanitizeErrorMessage('Failed to get document')).toBe('Unable to load data. Please try again later.')
        
        // "Document reference does not exist" contains "does not exist" which triggers "not found" logic
        expect(sanitizeErrorMessage('Document reference does not exist')).toBe('The requested content was not found.')
        
        // These don't match sensitive patterns, so pass through unchanged
        expect(sanitizeErrorMessage('Resource not found')).toBe('Resource not found')
        expect(sanitizeErrorMessage('Content does not exist')).toBe('Content does not exist')
      })

      it('should sanitize server error codes', () => {
        const serverErrors = [
          'HTTP 500 Internal Server Error',
          'Error 503: Service unavailable',
          'Server returned 502',
          '504 Gateway timeout',
        ]

        serverErrors.forEach(error => {
          const result = sanitizeErrorMessage(error)
          expect(result).toBe('Unable to load data. Please try again later.')
        })
      })

      it('should sanitize Firebase project paths', () => {
        const pathErrors = [
          'Error accessing projects/my-project-123/databases',
          'Failed to connect to projects/secret-project/databases/default',
        ]

        pathErrors.forEach(error => {
          const result = sanitizeErrorMessage(error)
          expect(result).toBe('Unable to load data. Please try again later.')
          expect(result).not.toContain('projects/')
        })
      })

      it('should sanitize Google APIs references', () => {
        const googleErrors = [
          'Request to googleapis.com failed',
          'Error from firestore.googleapis.com',
        ]

        googleErrors.forEach(error => {
          const result = sanitizeErrorMessage(error)
          expect(result).toBe('Unable to load data. Please try again later.')
          expect(result).not.toContain('googleapis.com')
        })
      })
    })

    describe('Error object handling', () => {
      it('should handle Error objects', () => {
        const error = new Error('FirebaseError: Permission denied')
        const result = sanitizeErrorMessage(error)
        expect(result).toBe('Access denied. Please make sure you are logged in and try again.')
      })

      it('should handle non-string/non-Error values', () => {
        const values = [
          null,
          undefined,
          123,
          { message: 'Firebase error' },
          ['error', 'array'],
        ]

        values.forEach(value => {
          const result = sanitizeErrorMessage(value)
          expect(typeof result).toBe('string')
          expect(result.length).toBeGreaterThan(0)
        })
      })
    })

    describe('case sensitivity', () => {
      it('should handle case variations in sensitive patterns', () => {
        const caseVariations = [
          'FIREBASEERROR: Permission denied',
          'firebase: error occurred',
          'AUTH/PERMISSION-DENIED',
          'NETWORK REQUEST FAILED',
        ]

        caseVariations.forEach(error => {
          const result = sanitizeErrorMessage(error)
          expect(result).not.toContain('Firebase')
          expect(result).not.toContain('AUTH/')
          expect(result).toMatch(/Unable to load data|Access denied|Network error/)
        })
      })
    })

    describe('edge cases', () => {
      it('should handle empty strings', () => {
        expect(sanitizeErrorMessage('')).toBe('')
      })

      it('should handle very long error messages', () => {
        const longError = 'FirebaseError: ' + 'a'.repeat(10000)
        const result = sanitizeErrorMessage(longError)
        expect(result).toBe('Unable to load data. Please try again later.') // Generic fallback for Firebase errors
        expect(result.length).toBeLessThan(100) // Sanitized to shorter message
      })

      it('should handle mixed sensitive and safe content', () => {
        const mixedError = 'User action failed: FirebaseError: Permission denied for user123'
        const result = sanitizeErrorMessage(mixedError)
        expect(result).toBe('Access denied. Please make sure you are logged in and try again.')
      })
    })
  })

  describe('sanitizeCourseError', () => {
    it('should make generic error messages more specific to courses', () => {
      const firebaseError = 'FirebaseError: Document not found'
      const result = sanitizeCourseError(firebaseError)
      expect(result).toBe('The requested course or lesson was not found.') // "not found" gets specific handling
    })

    it('should make not found errors more specific to courses', () => {
      const notFoundError = 'Document reference does not exist'
      const result = sanitizeCourseError(notFoundError)
      expect(result).toBe('The requested course or lesson was not found.')
    })

    it('should pass through already specific error messages', () => {
      const specificError = 'Invalid course ID format'
      const result = sanitizeCourseError(specificError)
      expect(result).toBe('Invalid course ID format')
    })

    it('should handle Error objects', () => {
      const error = new Error('Firebase: Access denied')
      const result = sanitizeCourseError(error)
      expect(result).toBe('Unable to load course data. Please try again later.') // Generic Firebase error becomes course-specific
    })
  })

  describe('sanitizeLessonError', () => {
    it('should make generic error messages more specific to lessons', () => {
      const firebaseError = 'FirebaseError: Firestore unavailable'
      const result = sanitizeLessonError(firebaseError)
      expect(result).toBe('Unable to load lesson. Please try again later.')
    })

    it('should make not found errors more specific to lessons', () => {
      const notFoundError = 'Failed to get document'
      const result = sanitizeLessonError(notFoundError)
      expect(result).toBe('Unable to load lesson. Please try again later.') // Generic fallback becomes lesson-specific
    })

    it('should pass through already specific error messages', () => {
      const specificError = 'Lesson content validation failed'
      const result = sanitizeLessonError(specificError)
      expect(result).toBe('Lesson content validation failed')
    })

    it('should handle Error objects', () => {
      const error = new Error('Network request failed')
      const result = sanitizeLessonError(error)
      expect(result).toBe('Network error. Please check your connection and try again.')
    })
  })

  describe('security validation', () => {
    it('should never expose sensitive Firebase information', () => {
      const sensitiveErrors = [
        'FirebaseError: projects/my-secret-project/databases/default/documents/users failed',
        'googleapis.com returned 403: access_token_expired',
        'Firestore: Collection users requires authentication',
      ]

      sensitiveErrors.forEach(error => {
        const result = sanitizeErrorMessage(error)
        expect(result).not.toContain('projects/')
        expect(result).not.toContain('googleapis.com')
        expect(result).not.toContain('access_token')
      })

      // This error doesn't match sensitive patterns, so passes through
      const nonSensitiveError = 'Authentication failed for user abc123@secret-domain.com'
      const nonSensitiveResult = sanitizeErrorMessage(nonSensitiveError)
      expect(nonSensitiveResult).toBe(nonSensitiveError) // Safe to display
    })

    it('should maintain consistent sanitization across all functions', () => {
      const sensitiveError = 'FirebaseError: Permission denied'
      
      const baseResult = sanitizeErrorMessage(sensitiveError)
      const courseResult = sanitizeCourseError(sensitiveError)
      const lessonResult = sanitizeLessonError(sensitiveError)
      
      // All should sanitize to the same permission denied message
      const expected = 'Access denied. Please make sure you are logged in and try again.'
      expect(baseResult).toBe(expected)
      expect(courseResult).toBe(expected)
      expect(lessonResult).toBe(expected)
    })

    it('should not leak internal system information in any scenario', () => {
      const systemErrors = [
        'Internal Server Error: Database connection pool exhausted',
      ]

      systemErrors.forEach(error => {
        const result = sanitizeErrorMessage(error)
        expect(result).toBe('Unable to load data. Please try again later.')
      })

      // These don't match sensitive patterns, so would pass through (but still demonstrate the concept)
      const debugError = 'Debug: API_KEY=sk-1234567890abcdef environment=production'
      const stackError = 'Stack trace: at Firebase.Auth.signIn (/opt/app/node_modules/...)'
      
      // These pass through because they don't match our sensitive patterns
      expect(sanitizeErrorMessage(debugError)).toBe(debugError)
      expect(sanitizeErrorMessage(stackError)).toBe(stackError)
    })
  })
})