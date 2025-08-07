import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import Container from 'react-bootstrap/Container'
import Alert from 'react-bootstrap/Alert'
import logoDark from '../assets/logo_dark.svg'

function Home() {
  const location = useLocation()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
      // Clear the message from location state
      window.history.replaceState({}, document.title)
    }
  }, [location])

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [message])
  return (
    <>
      {message && (
        <div 
          className="position-absolute w-100"
          style={{ 
            top: '84px',
            left: 0,
            zIndex: 1040,
            backgroundColor: 'var(--bs-dark)'
          }}
        >
          <Container>
            <Alert variant="success" dismissible onClose={() => setMessage('')} className="mb-0">
              {message}
            </Alert>
          </Container>
        </div>
      )}
      
      <Container fluid className="App">
        <div className="text-center my-5">
          <img id="home-logo" src={logoDark} alt="Practice Makes Perfect Logo" className="mb-4" />
        </div>
        <div id="home-title" className="text-center">
          <h1>Lightbulb moments</h1> 
          <h1>with</h1>
          <h1 className="accent">Practice Makes Perfect.</h1>
        </div>
      </Container>
    </>
  )
}

export default Home
