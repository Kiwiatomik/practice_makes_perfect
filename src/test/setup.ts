import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('../config/firebase', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    batch: vi.fn(),
  },
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
  },
  functions: {
    httpsCallable: vi.fn(),
  },
  analytics: {
    logEvent: vi.fn(),
    setUserProperties: vi.fn(),
    setUserId: vi.fn(),
  },
  performance: {
    trace: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      putAttribute: vi.fn(),
      putMetric: vi.fn(),
    })),
  },
}))

// Mock Firebase services
vi.mock('../services/coursesService', () => ({
  getCourses: vi.fn(),
  getCourse: vi.fn(),
  getLesson: vi.fn(),
  getPrompts: vi.fn(),
  createPrompt: vi.fn(),
  createMultiplePrompts: vi.fn(),
}))

// Mock AI service
vi.mock('../services/aiService', () => ({
  solveQuestion: vi.fn(),
  generatePracticeQuestion: vi.fn(),
  generateNextLevelQuestion: vi.fn(),
}))

// Mock React Router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/' }),
  }
})

// Mock KaTeX
vi.mock('react-katex', () => ({
  InlineMath: ({ math }: { math: string }) => `<span>InlineMath: ${math}</span>`,
  BlockMath: ({ math }: { math: string }) => `<div>BlockMath: ${math}</div>`,
}))

// Mock AuthContext for hooks testing
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user-id', email: 'test@example.com' },
    loading: false,
  })),
}))

// Global test utilities
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}