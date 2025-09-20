import { useEffect, useState } from 'react'
import { getHealthStatus, getReadinessStatus, getLivenessStatus } from '../services/healthService'

interface HealthCheckProps {
  type: 'health' | 'ready' | 'live'
}

export default function HealthCheck({ type }: HealthCheckProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        let result
        switch (type) {
          case 'health':
            result = await getHealthStatus()
            break
          case 'ready':
            result = await getReadinessStatus()
            break
          case 'live':
            result = await getLivenessStatus()
            break
        }
        setStatus(result)
      } catch (error) {
        setStatus({
          error: error instanceof Error ? error.message : 'Health check failed',
          status: 'unhealthy'
        })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [type])

  // Set appropriate HTTP status based on health
  useEffect(() => {
    if (!loading && status) {
      let httpStatus = 200

      switch (type) {
        case 'health':
          if (status.status === 'unhealthy') httpStatus = 503
          else if (status.status === 'degraded') httpStatus = 200
          break
        case 'ready':
          if (!status.ready) httpStatus = 503
          break
        case 'live':
          if (!status.alive) httpStatus = 503
          break
      }

      // This is a hack for setting HTTP status in a React app
      // In a real production setup, these would be server-side endpoints
      if (httpStatus !== 200) {
        document.title = `Health Check Failed - ${httpStatus}`
      }
    }
  }, [loading, status, type])

  if (loading) {
    return (
      <pre style={{ padding: '1rem' }}>
        {JSON.stringify({ status: 'checking' }, null, 2)}
      </pre>
    )
  }

  // Return appropriate response format for each endpoint type
  let response
  switch (type) {
    case 'health':
      response = status
      break
    case 'ready':
      response = {
        status: status.ready ? 'ready' : 'not ready',
        ready: status.ready,
        reason: status.reason || undefined
      }
      break
    case 'live':
      response = {
        status: status.alive ? 'alive' : 'dead',
        alive: status.alive
      }
      break
  }

  return (
    <pre style={{
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '0.375rem',
      margin: '1rem'
    }}>
      {JSON.stringify(response, null, 2)}
    </pre>
  )
}

// Individual endpoint components for different health check types
export function HealthEndpoint() {
  return <HealthCheck type="health" />
}

export function ReadinessEndpoint() {
  return <HealthCheck type="ready" />
}

export function LivenessEndpoint() {
  return <HealthCheck type="live" />
}