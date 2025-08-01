import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Navigation from './components/Navigation'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import Lesson from './components/Lesson'
import Courses from './components/Courses'
import CoursePage from './components/CoursePage'
import './styles/custom-bootstrap.scss'
import './App.css'

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CoursePage />} />
        <Route path="/lesson" element={<Lesson />} />
        <Route path="/lesson/:id" element={<Lesson />} />
      </Routes>
    </Router>
  )
}

export default App
