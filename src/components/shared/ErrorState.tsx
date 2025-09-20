import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import { Link } from 'react-router'

interface ErrorStateProps {
  title: string
  message: string
  onRetry?: () => void
  backLink?: string
  backText?: string
  retryText?: string
}

function ErrorState({ 
  title, 
  message, 
  onRetry, 
  backLink, 
  backText = 'Go Back',
  retryText = 'Try Again'
}: ErrorStateProps) {
  return (
    <Container className="my-4">
      <Alert variant="danger">
        <Alert.Heading>{title}</Alert.Heading>
        <p>{message}</p>
        <div>
          {onRetry && (
            <Button variant="outline-danger" onClick={onRetry} className="me-2">
              {retryText}
            </Button>
          )}
          {backLink && (
            <Button as={Link as any} to={backLink} variant="secondary">
              {backText}
            </Button>
          )}
        </div>
      </Alert>
    </Container>
  )
}

export default ErrorState