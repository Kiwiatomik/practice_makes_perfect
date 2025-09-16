import { BrowserRouter as Router, Routes, Route } from 'react-router'
import { Suspense, lazy } from 'react'
import Navigation from './components/Navigation'
import LoadingState from './components/shared/LoadingState'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy load page components for code splitting
const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Lesson = lazy(() => import('./pages/Lesson'))
const BrowseCourses = lazy(() => import('./pages/BrowseCourses'))
const CoursePage = lazy(() => import('./pages/CoursePage'))
const Account = lazy(() => import('./pages/Account'))
const CreateCourse = lazy(() => import('./pages/CreateCourse'))
const CreateLesson = lazy(() => import('./pages/CreateLesson'))
const NotFound = lazy(() => import('./pages/NotFound'))
import './styles/custom-bootstrap.scss'

function App() {
  return (
    <Router>
      <Navigation />
      <Suspense fallback={<LoadingState message="Loading page..." />}>
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
      </Suspense>
    </Router>
  )
}

export default App
