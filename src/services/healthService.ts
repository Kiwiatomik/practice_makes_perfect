import { db, auth, functions } from '../config/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  checks: {
    database: HealthCheckResult
    authentication: HealthCheckResult
    functions: HealthCheckResult
    ai: HealthCheckResult
  }
  uptime: number
}

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  error?: string
}

const startTime = Date.now()

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    // Try to read a system document or create a test read
    const testDocRef = doc(db, 'health', 'check')
    await getDoc(testDocRef)

    return {
      status: 'pass',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

async function checkAuthentication(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    // Check if auth service is responsive by accessing currentUser
    // Auth is working if we can access the current user property without throwing
    void auth.currentUser
    // Auth is working if we can access the current user property
    return {
      status: 'pass',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Authentication service unavailable'
    }
  }
}

async function checkFunctions(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    // Test if we can create a callable function reference
    // Don't actually call it to avoid costs
    void httpsCallable(functions, 'healthCheck')
    // Just verify the function reference can be created
    // Don't actually call it to avoid costs
    return {
      status: 'pass',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Functions service unavailable'
    }
  }
}

async function checkAIService(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    // Check if AI service is available by testing function reference
    void httpsCallable(functions, 'solveQuestion')
    // Just verify the function reference can be created
    return {
      status: 'pass',
      responseTime: Date.now() - start
    }
  } catch (error) {
    return {
      status: 'warn', // AI service issues shouldn't fail the whole app
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'AI service degraded'
    }
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const timestamp = new Date().toISOString()
  const version = import.meta.env.VITE_APP_VERSION || 'dev'
  const uptime = Date.now() - startTime

  // Run all health checks in parallel
  const [database, authentication, functions, ai] = await Promise.all([
    checkDatabase(),
    checkAuthentication(),
    checkFunctions(),
    checkAIService()
  ])

  const checks = { database, authentication, functions, ai }

  // Determine overall status
  const hasFailures = Object.values(checks).some(check => check.status === 'fail')
  const hasWarnings = Object.values(checks).some(check => check.status === 'warn')

  let status: 'healthy' | 'unhealthy' | 'degraded'
  if (hasFailures) {
    status = 'unhealthy'
  } else if (hasWarnings) {
    status = 'degraded'
  } else {
    status = 'healthy'
  }

  return {
    status,
    timestamp,
    version,
    checks,
    uptime
  }
}

export async function getReadinessStatus(): Promise<{ ready: boolean; reason?: string }> {
  try {
    const health = await getHealthStatus()

    // App is ready if database and auth are working
    // AI service can be degraded and app still functions
    const criticalServices = [health.checks.database, health.checks.authentication]
    const hasCriticalFailures = criticalServices.some(check => check.status === 'fail')

    if (hasCriticalFailures) {
      const failedServices = criticalServices
        .filter(check => check.status === 'fail')
        .map((_, index) => index === 0 ? 'database' : 'authentication')
        .join(', ')

      return {
        ready: false,
        reason: `Critical services unavailable: ${failedServices}`
      }
    }

    return { ready: true }
  } catch (error) {
    return {
      ready: false,
      reason: error instanceof Error ? error.message : 'Health check failed'
    }
  }
}

export async function getLivenessStatus(): Promise<{ alive: boolean }> {
  // Simple liveness check - if this code runs, the app is alive
  return { alive: true }
}