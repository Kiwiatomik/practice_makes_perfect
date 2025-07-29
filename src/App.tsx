import Container from 'react-bootstrap/Container'
import Navigation from './components/Navigation'

import './styles/custom-bootstrap.scss'
import './App.css'

function App() {
  return (
    <>
      <Navigation />
      <Container fluid className="App">
        <h1>Lightbulb moments</h1> 
        <h1>with</h1>
        <h1 class="accent">Practice Makes Perfect.</h1>
      </Container>
    </>
  )
}

export default App
