import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Navigation from './components/Navigation'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import Lesson from './components/Lesson.tsx'
import './styles/custom-bootstrap.scss'
import './App.css'

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lesson" element={<Lesson />} />
      </Routes>
    </Router>
  )
}

export default App
