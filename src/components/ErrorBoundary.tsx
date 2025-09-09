import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container className="my-5">
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p>
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3 text-start">
                <summary className="mb-2">Error Details (Development Only)</summary>
                <pre className="bg-dark text-light p-3 rounded">
                  {this.state.error.toString()}
                  {this.state.error.stack && '\n' + this.state.error.stack}
                </pre>
              </details>
            )}
            <hr />
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="primary" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;