import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Lesson from './pages/Lesson'
import BrowseCourses from './pages/BrowseCourses'
import CoursePage from './pages/CoursePage'
import Account from './pages/Account'
import AdminQuestionPopulator from './pages/AdminQuestionPopulator'
import CreateCourse from './pages/CreateCourse'
import CreateLesson from './pages/CreateLesson'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import './styles/custom-bootstrap.scss'

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
        <Route path="/courses" element={<BrowseCourses />} />
        <Route path="/course/:id" element={<CoursePage />} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<Lesson />} />
        <Route path="/account" element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        } />
        <Route path="/create-course" element={
          <ProtectedRoute>
            <CreateCourse />
          </ProtectedRoute>
        } />
        <Route path="/course/:courseId/add-lesson" element={
          <ProtectedRoute>
            <CreateLesson />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
