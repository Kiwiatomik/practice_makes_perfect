import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

const ProtectedRoute = ({ children, redirectTo = '/' }: ProtectedRouteProps) => {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return (
      <Container className="mt-5">
        <Alert variant="warning" className="text-center">
          <Alert.Heading>Authentication Required</Alert.Heading>
          <p>
            You need to be logged in to access this page.
          </p>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = redirectTo}
            className="me-2"
          >
            Go to Home
          </Button>
        </Alert>
      </Container>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute