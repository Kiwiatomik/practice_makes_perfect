import * as Sentry from '@sentry/react';

const isDevelopment = import.meta.env.MODE === 'development';

export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: !isDevelopment,

    // Performance monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,

    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Advanced options
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Don't capture console logs in production
    beforeSend(event) {
      if (event.level === 'info' || event.level === 'log') {
        return null;
      }
      return event;
    },

    // Set release version
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
  });
};

// Custom error boundary wrapper
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance monitoring helpers
export const startSpan = (name: string, op: string, callback: (span: any) => any) => {
  return Sentry.startSpan({ name, op }, callback);
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope(scope => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id: string; email?: string }) => {
  Sentry.setUser(user);
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};