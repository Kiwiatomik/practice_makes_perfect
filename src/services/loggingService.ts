import { captureException, captureMessage, addBreadcrumb } from '../config/sentry';
import analyticsService from './analyticsService';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  sessionId?: string;
  courseId?: string;
  lessonId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class LoggingService {
  private sessionId: string;
  private context: LogContext = {};

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set global context that will be included in all logs
  setGlobalContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  // Clear global context
  clearGlobalContext() {
    this.context = {};
  }

  // Main logging method
  log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const fullContext = {
      ...this.context,
      ...context,
      sessionId: this.sessionId,
      timestamp,
      level,
    };

    // Console logging (always enabled in development)
    if (import.meta.env.DEV) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, fullContext);
    }

    // Add breadcrumb for Sentry
    addBreadcrumb({
      message,
      level: level as any,
      category: 'application',
      data: fullContext,
    });

    // Send to Sentry for warn/error levels
    if (level === 'error') {
      if (context?.error instanceof Error) {
        captureException(context.error, fullContext);
      } else {
        captureMessage(message, 'error');
      }
    } else if (level === 'warn') {
      captureMessage(message, 'warning');
    }

    // Track errors in analytics
    if (level === 'error') {
      analyticsService.trackError(
        context?.errorType || 'application_error',
        message,
        fullContext
      );
    }
  }

  // Convenience methods
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, { ...context, error, errorType: 'application' });
  }

  // Specific logging methods for different parts of the app
  authEvent(event: string, context?: LogContext) {
    this.info(`Auth: ${event}`, { ...context, category: 'authentication' });
  }

  courseEvent(event: string, courseId: string, context?: LogContext) {
    this.info(`Course: ${event}`, { ...context, courseId, category: 'course' });
  }

  lessonEvent(event: string, lessonId: string, context?: LogContext) {
    this.info(`Lesson: ${event}`, { ...context, lessonId, category: 'lesson' });
  }

  aiEvent(event: string, context?: LogContext) {
    this.info(`AI: ${event}`, { ...context, category: 'ai' });
  }

  performanceEvent(event: string, metrics: Record<string, number>, context?: LogContext) {
    this.info(`Performance: ${event}`, { ...context, metrics, category: 'performance' });
  }

  // Error boundaries
  errorBoundary(error: Error, errorInfo: any, component?: string) {
    this.error(`Error Boundary: ${error.message}`, error, {
      component,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorType: 'react_error_boundary'
    });
  }

  // API errors
  apiError(endpoint: string, error: Error, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, error, {
      ...context,
      endpoint,
      errorType: 'api_error'
    });
  }

  // Firebase errors
  firebaseError(operation: string, error: Error, context?: LogContext) {
    this.error(`Firebase Error: ${operation}`, error, {
      ...context,
      operation,
      errorType: 'firebase_error'
    });
  }

  // User actions
  userAction(action: string, context?: LogContext) {
    this.info(`User Action: ${action}`, { ...context, category: 'user_action' });
  }
}

export default new LoggingService();