#!/usr/bin/env node

import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = resolve(__dirname, '../dist')

// Ensure dist directory exists
try {
  mkdirSync(distPath, { recursive: true })
} catch (err) {
  // Directory might already exist
}

const timestamp = new Date().toISOString()
const version = process.env.VITE_APP_VERSION || process.env.npm_package_version || 'dev'
const environment = process.env.NODE_ENV || 'development'

const healthData = {
  status: 'healthy',
  timestamp,
  service: 'practice-makes-perfect',
  version,
  environment,
  buildTime: timestamp
}

const livenessData = {
  status: 'alive',
  alive: true,
  timestamp,
  version
}

const readinessData = {
  status: 'ready',
  ready: true,
  timestamp,
  version
}

// Generate health check files
writeFileSync(
  resolve(distPath, 'health.json'),
  JSON.stringify(healthData, null, 2)
)

writeFileSync(
  resolve(distPath, 'health'),
  JSON.stringify(healthData, null, 2)
)

writeFileSync(
  resolve(distPath, 'live.json'),
  JSON.stringify(livenessData, null, 2)
)

writeFileSync(
  resolve(distPath, 'ready.json'),
  JSON.stringify(readinessData, null, 2)
)

console.log('✅ Health check files generated successfully')
console.log(`   Version: ${version}`)
console.log(`   Environment: ${environment}`)
console.log(`   Timestamp: ${timestamp}`)
console.log(`   Files: health.json, health, live.json, ready.json`)