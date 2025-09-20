import { useState, useEffect } from 'react'
import { Container, Card, Badge, Table, Button, Alert } from 'react-bootstrap'
import { getHealthStatus, type HealthStatus } from '../services/healthService'
import LoadingState from '../components/shared/LoadingState'
import ErrorState from '../components/shared/ErrorState'

export default function Health() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchHealthStatus = async () => {
    try {
      setError(null)
      const status = await getHealthStatus()
      setHealthStatus(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchHealthStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'success'
      case 'degraded':
      case 'warn':
        return 'warning'
      case 'unhealthy':
      case 'fail':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  if (loading) {
    return <LoadingState message="Checking system health..." />
  }

  if (error && !healthStatus) {
    return (
      <Container className="mt-4">
        <ErrorState
          message={error || 'Unknown error occurred'}
          onRetry={fetchHealthStatus}
          title="Health Check Failed"
        />
      </Container>
    )
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>System Health Status</h1>
        <div>
          <Button
            variant="outline-primary"
            size="sm"
            className="me-2"
            onClick={fetchHealthStatus}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "success" : "outline-secondary"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="warning" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {healthStatus && (
        <>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Overall Status</h5>
                <Badge bg={getStatusVariant(healthStatus.status)} className="fs-6">
                  {healthStatus.status.toUpperCase()}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Version:</strong> {healthStatus.version}</p>
                  <p><strong>Uptime:</strong> {formatUptime(healthStatus.uptime)}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Last Check:</strong> {new Date(healthStatus.timestamp).toLocaleString()}</p>
                  <p><strong>Next Refresh:</strong> {autoRefresh ? 'In 30s' : 'Manual'}</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Service Health Checks</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(healthStatus.checks).map(([service, check]) => (
                    <tr key={service}>
                      <td className="text-capitalize">{service}</td>
                      <td>
                        <Badge bg={getStatusVariant(check.status)}>
                          {check.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td>{check.responseTime ? `${check.responseTime}ms` : 'N/A'}</td>
                      <td>
                        {check.error ? (
                          <span className="text-danger">{check.error}</span>
                        ) : (
                          <span className="text-success">Operational</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  )
}