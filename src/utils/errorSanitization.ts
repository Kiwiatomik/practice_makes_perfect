/**
 * Sanitizes error messages to prevent sensitive information leakage
 * 
 * @param error - Raw error message or Error object
 * @returns Safe error message for user display
 */
export const sanitizeErrorMessage = (error: string | Error | unknown): string => {
  // Convert to string if it's an Error object
  const errorString = error instanceof Error ? error.message : String(error)
  
  // Patterns that indicate sensitive Firebase/system information
  const sensitivePatterns = [
    /FirebaseError:/i,
    /Firebase:/i,
    /auth\//i,
    /firestore/i,
    /googleapis\.com/i,
    /projects\/[^/]+\/databases/i,  // Firebase project paths
    /Missing or insufficient permissions/i,
    /PERMISSION_DENIED/i,
    /Network request failed/i,
    /client is offline/i,
    /Document reference does not exist/i,
    /Failed to get document/i,
    /Access denied/i,
    /Unauthorized/i,
    /Internal Server Error/i,
    /500|503|502|504/,  // HTTP error codes
  ]
  
  // Check if error contains sensitive information
  const containsSensitiveInfo = sensitivePatterns.some(pattern => 
    pattern.test(errorString)
  )
  
  if (containsSensitiveInfo) {
    // Return generic message based on likely error context
    if (errorString.toLowerCase().includes('permission') || 
        errorString.toLowerCase().includes('auth')) {
      return 'Access denied. Please make sure you are logged in and try again.'
    }
    
    if (errorString.toLowerCase().includes('network') || 
        errorString.toLowerCase().includes('offline')) {
      return 'Network error. Please check your connection and try again.'
    }
    
    if (errorString.toLowerCase().includes('not found') ||
        errorString.toLowerCase().includes('does not exist')) {
      return 'The requested resource was not found'
    }
    
    // Generic fallback for any other sensitive errors
    return 'Unable to load data. Please try again later.'
  }
  
  // Error appears safe to display - return as is
  return errorString
}

/**
 * Sanitizes error messages specifically for course/lesson loading contexts
 */
export const sanitizeCourseError = (error: string | Error | unknown): string => {
  const sanitized = sanitizeErrorMessage(error)
  
  // If it was sanitized to generic message, make it more specific to courses
  if (sanitized === 'Unable to load data. Please try again later.') {
    return 'Unable to load course data. Please try again later.'
  }
  
  if (sanitized === 'The requested content was not found.') {
    return 'The requested course or lesson was not found.'
  }
  
  return sanitized
}

/**
 * Sanitizes error messages for lesson-specific contexts
 */
export const sanitizeLessonError = (error: string | Error | unknown): string => {
  const sanitized = sanitizeErrorMessage(error)
  
  // If it was sanitized to generic message, make it more specific to lessons
  if (sanitized === 'Unable to load data. Please try again later.') {
    return 'Unable to load lesson. Please try again later.'
  }
  
  if (sanitized === 'The requested content was not found.') {
    return 'The requested lesson was not found.'
  }
  
  return sanitized
}