import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import { Link } from 'react-router'

function NotFound() {
  return (
    <Container className="my-5">
      <div className="text-center">
        <h1 className="display-1 fw-bold">404</h1>
        <p className="fs-3">
          <span className="text-danger">Oops!</span> Page not found
        </p>
        <p className="lead mb-4">
          The page you're looking for doesn't exist.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Button as={Link as any} to="/" variant="primary">
            Go Home
          </Button>
          <Button as={Link as any} to="/courses" variant="outline-primary">
            Browse Courses
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default NotFound