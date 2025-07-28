import { Container, Row, Col, Card } from 'react-bootstrap'
import './App.css'

function App() {
  return (
    <Container fluid className="App">
      <Row className="justify-content-center mt-5">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body className="text-center">
              <Card.Title as="h1">Practice Makes Perfect</Card.Title>
              <Card.Text>
                A learning platform that creates content that grows with you.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default App