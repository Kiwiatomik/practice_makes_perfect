import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'

function Dashboard() {
  return (
    <Container className="my-4">
      <Row>
        <Col>
          <h1 className="mb-4">Dashboard</h1>
          
          <Row className="g-4">
            <Col md={6} lg={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Learning Progress</Card.Title>
                  <Card.Text>
                    Your overall progress across all learning paths will be displayed here.
                  </Card.Text>
                  <div className="text-muted">
                    <small>Data will be loaded from database</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Recent Activities</Card.Title>
                  <Card.Text>
                    Your recent practice sessions and completed exercises.
                  </Card.Text>
                  <div className="text-muted">
                    <small>Data will be loaded from database</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Recommended Paths</Card.Title>
                  <Card.Text>
                    Personalized learning paths based on your performance gaps.
                  </Card.Text>
                  <div className="text-muted">
                    <small>Data will be loaded from database</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Current Streak</Card.Title>
                  <Card.Text>
                    Track your daily practice consistency.
                  </Card.Text>
                  <div className="text-muted">
                    <small>Data will be loaded from database</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Achievements</Card.Title>
                  <Card.Text>
                    Badges and milestones you've earned through practice.
                  </Card.Text>
                  <div className="text-muted">
                    <small>Data will be loaded from database</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4}>
              <Card>
                <Card.Body>
                  <Card.Title>Quick Practice</Card.Title>
                  <Card.Text>
                    Jump into a quick practice session based on your current level.
                  </Card.Text>
                  <Button variant="primary" className="mt-2">
                    Start Practice
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard