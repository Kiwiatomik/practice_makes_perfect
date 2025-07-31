import Container from 'react-bootstrap/Container'
import logoDark from '../assets/logo_dark.svg'

function Home() {
  return (
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
  )
}

export default Home