import { useState } from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import { Link, useNavigate } from 'react-router'
import logoDark from '../assets/logo_dark.svg'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import { useAuth } from '../contexts/AuthContext'

import './Navigation.css'

const Navigation = () => {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/', { 
        state: { message: 'You have been successfully logged out.' }
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleSwitchToRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

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
              {currentUser && (
                <NavDropdown.Item as={Link} to="/account">Account</NavDropdown.Item>
              )}
              <NavDropdown.Divider />
              {currentUser ? (
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              ) : (
                <>
                  <NavDropdown.Item onClick={() => setShowLoginModal(true)}>Log In</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => setShowRegisterModal(true)}>Register</NavDropdown.Item>
                </>
              )}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    
    <LoginModal 
      show={showLoginModal}
      onHide={() => setShowLoginModal(false)}
      onSwitchToRegister={handleSwitchToRegister}
    />
    
    <RegisterModal 
      show={showRegisterModal}
      onHide={() => setShowRegisterModal(false)}
      onSwitchToLogin={handleSwitchToLogin}
    />
    </>
  );
};

export default Navigation;
