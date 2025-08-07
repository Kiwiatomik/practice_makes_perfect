import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../config/firebase'
import { useModalBlurEffect } from '../hooks/useModalBlurEffect'
import './AuthModal.css'

interface LoginModalProps {
  show: boolean;
  onHide: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal = ({ show, onHide, onSwitchToRegister }: LoginModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Apply modal blur effect
  useModalBlurEffect({ show })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields')
      }

      // Firebase authentication
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      
      // On success, close modal and reset form
      onHide()
      setFormData({ email: '', password: '' })
      
    } catch (err) {
      let errorMessage = 'Authentication failed'
      
      if (err instanceof Error) {
        // Handle specific Firebase errors
        switch (err.message) {
          case 'Firebase: Error (auth/user-not-found).':
            errorMessage = 'No account found with this email'
            break
          case 'Firebase: Error (auth/wrong-password).':
            errorMessage = 'Incorrect password'
            break
          case 'Firebase: Error (auth/invalid-email).':
            errorMessage = 'Invalid email address'
            break
          case 'Firebase: Error (auth/too-many-requests).':
            errorMessage = 'Too many failed attempts. Please try again later'
            break
          case 'Firebase: Error (auth/user-disabled).':
            errorMessage = 'This account has been disabled'
            break
          default:
            errorMessage = err.message.includes('Firebase:') 
              ? err.message.replace('Firebase: Error ', '').replace(/[()]/g, '')
              : err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const googleProvider = new GoogleAuthProvider()
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      })
      
      // Use popup for development - more reliable than redirect
      await signInWithPopup(auth, googleProvider)
      
      // On success, close modal
      onHide()
      
    } catch (err) {
      console.error('LoginModal - Google login error:', err)
      let errorMessage = 'Google authentication failed'
      
      if (err instanceof Error) {
        // Handle specific Firebase errors
        switch (err.code || err.message) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-in cancelled'
            break
          case 'auth/popup-blocked':
            errorMessage = 'Popup blocked by browser. Please allow popups and try again'
            break
          case 'auth/cancelled-popup-request':
            errorMessage = 'Sign-in cancelled'
            break
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'Account exists with different sign-in method'
            break
          default:
            errorMessage = err.message.includes('Firebase:') 
              ? err.message.replace('Firebase: Error ', '').replace(/[()]/g, '')
              : err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ email: '', password: '' })
    setError('')
    onHide()
  }

  const handleSwitchToRegister = () => {
    setFormData({ email: '', password: '' })
    setError('')
    onSwitchToRegister()
  }

  return (
    <Modal show={show} onHide={handleClose} centered data-bs-theme="dark" className="auth-modal">
      <Modal.Header closeButton>
        <Modal.Title>Log In</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleEmailPasswordLogin}>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              disabled={loading}
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Logging In...
              </>
            ) : (
              'Log In'
            )}
          </Button>
        </Form>

        <div className="text-center mb-3">
          <span className="divider-text">or</span>
        </div>

        <Button
          variant="outline-light"
          className="w-100 mb-3 google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="me-2"
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <div className="text-center">
          <Button
            variant="link"
            onClick={handleSwitchToRegister}
            disabled={loading}
            className="text-decoration-none switch-mode-btn"
          >
            Don't have an account? Register
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default LoginModal