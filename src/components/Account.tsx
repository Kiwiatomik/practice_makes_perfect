import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'

const Account = () => {
  const { currentUser } = useAuth()
  const [emailFormData, setEmailFormData] = useState({
    newEmail: '',
    currentPassword: ''
  })
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [loading, setLoading] = useState({
    email: false,
    password: false
  })
  const [error, setError] = useState({
    email: '',
    password: ''
  })
  const [success, setSuccess] = useState({
    email: '',
    password: ''
  })

  const clearMessages = (type: 'email' | 'password') => {
    setError(prev => ({ ...prev, [type]: '' }))
    setSuccess(prev => ({ ...prev, [type]: '' }))
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmailFormData(prev => ({ ...prev, [name]: value }))
    clearMessages('email')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordFormData(prev => ({ ...prev, [name]: value }))
    clearMessages('password')
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !currentUser.email) return

    setLoading(prev => ({ ...prev, email: true }))
    clearMessages('email')

    try {
      // Validate form
      if (!emailFormData.newEmail || !emailFormData.currentPassword) {
        throw new Error('Please fill in all fields')
      }

      if (emailFormData.newEmail === currentUser.email) {
        throw new Error('New email must be different from current email')
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        emailFormData.currentPassword
      )
      await reauthenticateWithCredential(currentUser, credential)

      // Update email
      await updateEmail(currentUser, emailFormData.newEmail)

      setSuccess(prev => ({ ...prev, email: 'Email updated successfully!' }))
      setEmailFormData({ newEmail: '', currentPassword: '' })

    } catch (err) {
      let errorMessage = 'Failed to update email'
      
      if (err instanceof Error) {
        switch (err.code || err.message) {
          case 'auth/wrong-password':
            errorMessage = 'Current password is incorrect'
            break
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already in use by another account'
            break
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address'
            break
          case 'auth/requires-recent-login':
            errorMessage = 'Please log out and log back in, then try again'
            break
          default:
            errorMessage = err.message.includes('Firebase:') 
              ? err.message.replace('Firebase: Error ', '').replace(/[()]/g, '')
              : err.message
        }
      }
      
      setError(prev => ({ ...prev, email: errorMessage }))
    } finally {
      setLoading(prev => ({ ...prev, email: false }))
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !currentUser.email) return

    setLoading(prev => ({ ...prev, password: true }))
    clearMessages('password')

    try {
      // Validate form
      if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmNewPassword) {
        throw new Error('Please fill in all fields')
      }

      if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
        throw new Error('New passwords do not match')
      }
      
      if (passwordFormData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters')
      }

      if (passwordFormData.newPassword === passwordFormData.currentPassword) {
        throw new Error('New password must be different from current password')
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordFormData.currentPassword
      )
      await reauthenticateWithCredential(currentUser, credential)

      // Update password
      await updatePassword(currentUser, passwordFormData.newPassword)

      setSuccess(prev => ({ ...prev, password: 'Password updated successfully!' }))
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })

    } catch (err) {
      let errorMessage = 'Failed to update password'
      
      if (err instanceof Error) {
        switch (err.code || err.message) {
          case 'auth/wrong-password':
            errorMessage = 'Current password is incorrect'
            break
          case 'auth/weak-password':
            errorMessage = 'New password is too weak'
            break
          case 'auth/requires-recent-login':
            errorMessage = 'Please log out and log back in, then try again'
            break
          default:
            errorMessage = err.message.includes('Firebase:') 
              ? err.message.replace('Firebase: Error ', '').replace(/[()]/g, '')
              : err.message
        }
      }
      
      setError(prev => ({ ...prev, password: errorMessage }))
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  if (!currentUser) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="warning">
              Please log in to access your account settings.
            </Alert>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <h2 className="text-center mb-4">Account Settings</h2>
          
          {/* Current Account Info */}
          <Card className="mb-4" data-bs-theme="dark">
            <Card.Header>
              <h5 className="mb-0">Account Information</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Email:</strong> {currentUser.email}</p>
            </Card.Body>
          </Card>

          {/* Email Messages */}
          {(error.email || success.email) && (
            <>
              {error.email && (
                <Alert variant="danger" className="mb-3" dismissible onClose={() => clearMessages('email')}>
                  {error.email}
                </Alert>
              )}
              {success.email && (
                <Alert variant="success" className="mb-3" dismissible onClose={() => clearMessages('email')}>
                  {success.email}
                </Alert>
              )}
            </>
          )}

          {/* Change Email */}
          <Card className="mb-4" data-bs-theme="dark">
            <Card.Header>
              <h5 className="mb-0">Change Email Address</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleUpdateEmail}>
                <Form.Group className="mb-3">
                  <Form.Label>New Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="newEmail"
                    value={emailFormData.newEmail}
                    onChange={handleEmailChange}
                    placeholder="Enter new email address"
                    disabled={loading.email}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={emailFormData.currentPassword}
                    onChange={handleEmailChange}
                    placeholder="Enter your current password"
                    disabled={loading.email}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading.email}
                >
                  {loading.email ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Updating Email...
                    </>
                  ) : (
                    'Update Email'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Password Messages */}
          {(error.password || success.password) && (
            <>
              {error.password && (
                <Alert variant="danger" className="mb-3" dismissible onClose={() => clearMessages('password')}>
                  {error.password}
                </Alert>
              )}
              {success.password && (
                <Alert variant="success" className="mb-3" dismissible onClose={() => clearMessages('password')}>
                  {success.password}
                </Alert>
              )}
            </>
          )}

          {/* Change Password */}
          <Card className="mb-4" data-bs-theme="dark">
            <Card.Header>
              <h5 className="mb-0">Change Password</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleUpdatePassword}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    disabled={loading.password}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    disabled={loading.password}
                  />
                  <Form.Text className="text-muted">
                    Password must be at least 6 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmNewPassword"
                    value={passwordFormData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    disabled={loading.password}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading.password}
                >
                  {loading.password ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Account
