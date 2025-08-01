import { useState } from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
import { Link } from 'react-router'
import logoDark from '../assets/logo_dark.svg'
import AuthModal from './AuthModal'

import './Navigation.css'

const Navigation = () => {
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <>
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container className="nav-container">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img src={logoDark} alt="Practice Makes Perfect" className="me-2" />
          Practice Makes Perfect
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavDropdown title="Learn" id="learn-dropdown" className="btn btn-primary">
              <NavDropdown.Item as={Link} to="/dashboard">Dashboard</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/courses">All Courses</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/lesson">Lesson</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => setShowAuthModal(true)}>Login</NavDropdown.Item>
              <NavDropdown.Item href="#logout">Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    
    <AuthModal 
      show={showAuthModal}
      onHide={() => setShowAuthModal(false)}
    />
    </>
  );
};

export default Navigation;
