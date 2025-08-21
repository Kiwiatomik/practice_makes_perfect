import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Navigation from './components/Navigation'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import Lesson from './components/Lesson'
import Courses from './components/Courses'
import CoursePage from './components/CoursePage'
import Account from './components/Account'
import AdminQuestionPopulator from './components/AdminQuestionPopulator'
import ProtectedRoute from './components/ProtectedRoute'
import './styles/custom-bootstrap.scss'
import './App.css'

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CoursePage />} />
        <Route path="/lesson" element={
          <ProtectedRoute>
            <Lesson />
          </ProtectedRoute>
        } />
        <Route path="/lesson/:id" element={
          <ProtectedRoute>
            <Lesson />
          </ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        } />
        <Route path="/admin/questions" element={<AdminQuestionPopulator />} />
      </Routes>
    </Router>
  )
}

export default App
