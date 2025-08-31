import Container from 'react-bootstrap/Container'

interface LoadingStateProps {
  message?: string
}

function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <Container className="my-4">
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">{message}</span>
        </div>
        <p className="mt-2 text-muted">{message}</p>
      </div>
    </Container>
  )
}

export default LoadingState