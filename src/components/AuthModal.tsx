import { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../config/firebase'
import './AuthModal.css'

interface AuthModalProps {
  show: boolean;
  onHide: () => void;
}

type AuthMode = 'signin' | 'signup'

const AuthModal = ({ show, onHide }: AuthModalProps) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Add blur effect to background when modal is open
  useEffect(() => {
    const bodyElement = document.body
    const appElement = document.getElementById('root')
    
    if (show) {
      if (appElement) {
        appElement.style.filter = 'blur(3px)'
        appElement.style.transition = 'filter 0.3s ease-in-out'
      }
      bodyElement.style.overflow = 'hidden'
    } else {
      if (appElement) {
        appElement.style.filter = 'none'
      }
      bodyElement.style.overflow = 'unset'
    }

    // Cleanup function
    return () => {
      if (appElement) {
        appElement.style.filter = 'none'
      }
      bodyElement.style.overflow = 'unset'
    }
  }, [show])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields')
      }

      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
      }

      // Firebase authentication
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password)
      }
      
      // On success, close modal and reset form
      onHide()
      setFormData({ email: '', password: '', confirmPassword: '' })
      
    } catch (err) {
      let errorMessage = 'Authentication failed'
      
      if (err instanceof Error) {
        // Handle specific Firebase errors
        switch (err.message) {
          case 'Firebase: Error (auth/email-already-in-use).':
            errorMessage = 'Email is already registered'
            break
          case 'Firebase: Error (auth/weak-password).':
            errorMessage = 'Password is too weak'
            break
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

  const handleGoogleAuth = async () => {
    console.log('AuthModal - Starting Google authentication')
    setLoading(true)
    setError('')

    try {
      const googleProvider = new GoogleAuthProvider()
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      })
      
      console.log('AuthModal - Initiating popup for Google')
      // Use popup for development - more reliable than redirect
      const result = await signInWithPopup(auth, googleProvider)
      console.log('AuthModal - Google auth successful:', result.user.email)
      
      // On success, close modal and reset form
      onHide()
      
    } catch (err) {
      console.error('AuthModal - Google auth error:', err)
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

  const switchAuthMode = () => {
    setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin')
    setFormData({ email: '', password: '', confirmPassword: '' })
    setError('')
  }

  const handleClose = () => {
    setFormData({ email: '', password: '', confirmPassword: '' })
    setError('')
    setAuthMode('signin')
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} centered data-bs-theme="dark" className="auth-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          {authMode === 'signin' ? 'Sign In' : 'Create Account'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleEmailPasswordAuth}>
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

          {authMode === 'signup' && (
            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </Form.Group>
          )}

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
                {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              authMode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </Form>

        <div className="text-center mb-3">
          <span className="divider-text">or</span>
        </div>

        <Button
          variant="outline-light"
          className="w-100 mb-3 google-btn"
          onClick={handleGoogleAuth}
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
            onClick={switchAuthMode}
            disabled={loading}
            className="text-decoration-none switch-mode-btn"
          >
            {authMode === 'signin' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default AuthModal
