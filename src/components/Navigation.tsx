import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'

import './Navigation.css'

const Navigation = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container className="nav-container">
        <Navbar.Brand href="#home" className="d-flex align-items-center">
          {/* Logo placeholder - you can add an actual logo image here */}
          <div className="me-2" style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1a1a1a'
          }}>
            P
          </div>
          Practice Makes Perfect
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavDropdown title="Learn" id="learn-dropdown" className="btn btn-primary">
              <NavDropdown.Item href="#dashboard">Dashboard</NavDropdown.Item>
              <NavDropdown.Item href="#logout">Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
