import { useState } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification, deleteUser, AuthError } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { ThemeToggle } from '../components/shared/ThemeToggle'

const Account = () => {
  const { currentUser } = useAuth()
  useTheme() // Hook needed for theme context
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
    password: false,
    verification: false,
    delete: false
  })
  const [error, setError] = useState({
    email: '',
    password: '',
    verification: '',
    delete: ''
  })
  const [success, setSuccess] = useState({
    email: '',
    password: '',
    verification: '',
    delete: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const clearMessages = (type: 'email' | 'password' | 'verification' | 'delete') => {
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
        const firebaseError = err as AuthError
        switch (firebaseError.code || err.message) {
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
        const firebaseError = err as AuthError
        switch (firebaseError.code || err.message) {
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

  const handleSendVerification = async () => {
    if (!currentUser) return

    setLoading(prev => ({ ...prev, verification: true }))
    clearMessages('verification')

    try {
      await sendEmailVerification(currentUser)
      setSuccess(prev => ({ ...prev, verification: 'Verification email sent! Please check your inbox.' }))
    } catch (err) {
      let errorMessage = 'Failed to send verification email'

      if (err instanceof Error) {
        const firebaseError = err as AuthError
        switch (firebaseError.code) {
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please wait before requesting another verification email.'
            break
          default:
            errorMessage = err.message.includes('Firebase:') 
              ? err.message.replace('Firebase: Error ', '').replace(/[()]/g, '')
              : err.message
        }
      }
      
      setError(prev => ({ ...prev, verification: errorMessage }))
    } finally {
      setLoading(prev => ({ ...prev, verification: false }))
    }
  }

  const handleDeleteAccount = async () => {
    if (!currentUser || !currentUser.email) return

    setLoading(prev => ({ ...prev, delete: true }))
    clearMessages('delete')

    try {
      if (!deletePassword) {
        throw new Error('Please enter your current password')
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deletePassword
      )
      await reauthenticateWithCredential(currentUser, credential)

      // Delete user
      await deleteUser(currentUser)

      // User will be automatically logged out and redirected
      
    } catch (err) {
      let errorMessage = 'Failed to delete account'

      if (err instanceof Error) {
        const firebaseError = err as AuthError
        switch (firebaseError.code || err.message) {
          case 'auth/wrong-password':
            errorMessage = 'Current password is incorrect'
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
      
      setError(prev => ({ ...prev, delete: errorMessage }))
    } finally {
      setLoading(prev => ({ ...prev, delete: false }))
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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Account Settings</h2>
              <ThemeToggle />
            </div>
          
          {/* Current Account Info */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Account Information</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p>
                <strong>Email Verified:</strong>{' '}
                {currentUser.emailVerified ? (
                  <span className="text-success">✓ Verified</span>
                ) : (
                  <span
                    style={{ 
                      color: 'var(--bs-primary)', 
                      cursor: loading.verification ? 'default' : 'pointer',
                      opacity: loading.verification ? 0.6 : 1
                    }}
                    onClick={loading.verification ? undefined : handleSendVerification}
                  >
                    {loading.verification ? (
                      <>
                        <Spinner size="sm" className="me-1" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Email'
                    )}
                  </span>
                )}
              </p>
              <p>
                <strong>Account Created:</strong>{' '}
                {currentUser.metadata.creationTime 
                  ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown'
                }
              </p>
            </Card.Body>
          </Card>

          {/* Verification Messages */}
          {(error.verification || success.verification) && (
            <>
              {error.verification && (
                <Alert variant="danger" className="mb-3" dismissible onClose={() => clearMessages('verification')}>
                  {error.verification}
                </Alert>
              )}
              {success.verification && (
                <Alert variant="success" className="mb-3" dismissible onClose={() => clearMessages('verification')}>
                  {success.verification}
                </Alert>
              )}
            </>
          )}

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
          <Card className="mb-4">
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
          <Card className="mb-4">
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

          {/* Delete Messages */}
          {(error.delete || success.delete) && (
            <>
              {error.delete && (
                <Alert variant="danger" className="mb-3" dismissible onClose={() => clearMessages('delete')}>
                  {error.delete}
                </Alert>
              )}
              {success.delete && (
                <Alert variant="success" className="mb-3" dismissible onClose={() => clearMessages('delete')}>
                  {success.delete}
                </Alert>
              )}
            </>
          )}

          {/* Delete Account */}
          <Card className="mb-4 border-danger">
            <Card.Header className="bg-danger">
              <h5 className="mb-0 text-white">Danger Zone</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              
              {!showDeleteConfirm ? (
                <Button
                  variant="outline-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div>
                  <Alert variant="danger" className="mb-3">
                    <Alert.Heading>Are you absolutely sure?</Alert.Heading>
                    <p className="mb-3">
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </p>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Enter your current password to confirm:</Form.Label>
                      <Form.Control
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your current password"
                        disabled={loading.delete}
                      />
                    </Form.Group>
                    
                    <div className="d-flex gap-2">
                      <Button
                        variant="danger"
                        onClick={handleDeleteAccount}
                        disabled={loading.delete || !deletePassword}
                      >
                        {loading.delete ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Deleting Account...
                          </>
                        ) : (
                          'Yes, Delete My Account'
                        )}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setDeletePassword('')
                          clearMessages('delete')
                        }}
                        disabled={loading.delete}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Alert>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Account
