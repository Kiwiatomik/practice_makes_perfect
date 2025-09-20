#!/usr/bin/env node

/**
 * Deployment Script for Practice Makes Perfect
 * Handles environment-specific configuration and deployment automation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Environment configurations
const ENVIRONMENTS = {
  staging: {
    firebaseConfig: 'firebase.staging.json',
    firebaseProject: 'practice-makes-perfect-staging',
    url: 'https://practice-makes-perfect-staging.web.app',
    envPrefix: 'STAGING_'
  },
  production: {
    firebaseConfig: 'firebase.production.json',
    firebaseProject: 'practice-makes-perfect-5e85e',
    url: 'https://practice-makes-perfect-5e85e.web.app',
    envPrefix: ''
  }
};

class DeploymentManager {
  constructor(environment, options = {}) {
    this.environment = environment;
    this.config = ENVIRONMENTS[environment];
    this.options = options;
    this.deploymentId = `deploy-${Date.now()}-${environment}`;

    if (!this.config) {
      throw new Error(`Invalid environment: ${environment}. Valid options: ${Object.keys(ENVIRONMENTS).join(', ')}`);
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      deploy: '🚀'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async validateEnvironment() {
    this.log('Validating environment configuration...', 'info');

    // Check if Firebase config exists
    if (!fs.existsSync(this.config.firebaseConfig)) {
      throw new Error(`Firebase config not found: ${this.config.firebaseConfig}`);
    }

    // Validate required environment variables
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_SENTRY_DSN'
    ];

    const missingVars = requiredVars.filter(varName => {
      const envVar = this.config.envPrefix + varName;
      return !process.env[envVar] && !process.env[varName];
    });

    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    this.log('Environment validation passed', 'success');
  }

  async runSecurityChecks() {
    if (this.options.skipSecurity) {
      this.log('Skipping security checks (--skip-security)', 'warning');
      return;
    }

    this.log('Running security checks...', 'info');

    try {
      // Check for critical vulnerabilities
      execSync('npm audit --audit-level=critical', { stdio: 'pipe' });
      this.log('No critical security vulnerabilities found', 'success');
    } catch (error) {
      if (this.environment === 'production' && !this.options.force) {
        throw new Error('Critical security vulnerabilities detected. Use --force to override.');
      }
      this.log('Security vulnerabilities detected but continuing...', 'warning');
    }
  }

  async runTests() {
    if (this.options.skipTests) {
      this.log('Skipping tests (--skip-tests)', 'warning');
      return;
    }

    this.log('Running test suite...', 'info');

    try {
      execSync('npm run test:run', { stdio: 'inherit' });
      execSync('npm run lint', { stdio: 'inherit' });
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      this.log('All tests passed', 'success');
    } catch (error) {
      throw new Error('Tests failed. Fix issues before deploying.');
    }
  }

  async buildApplication() {
    this.log(`Building application for ${this.environment}...`, 'info');

    // Set environment variables for build
    const buildEnv = {
      ...process.env,
      VITE_ENVIRONMENT: this.environment,
      VITE_APP_VERSION: this.deploymentId
    };

    // Add environment-specific variables
    const envVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_SENTRY_DSN'
    ];

    envVars.forEach(varName => {
      const envVar = this.config.envPrefix + varName;
      if (process.env[envVar]) {
        buildEnv[varName] = process.env[envVar];
      }
    });

    try {
      execSync('npm run build', {
        stdio: 'inherit',
        env: buildEnv
      });
      this.log('Build completed successfully', 'success');
    } catch (error) {
      throw new Error('Build failed');
    }
  }

  async deployToFirebase() {
    this.log(`Deploying to ${this.environment}...`, 'deploy');

    try {
      // Switch to correct Firebase project
      execSync(`firebase use ${this.config.firebaseProject}`, { stdio: 'inherit' });

      // Deploy with environment-specific config
      execSync(`firebase deploy --config=${this.config.firebaseConfig}`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          FIREBASE_TOKEN: process.env.FIREBASE_TOKEN
        }
      });

      this.log(`Deployment to ${this.environment} completed`, 'success');
    } catch (error) {
      throw new Error(`Firebase deployment failed: ${error.message}`);
    }
  }

  async verifyDeployment() {
    if (this.options.skipVerification) {
      this.log('Skipping deployment verification (--skip-verification)', 'warning');
      return;
    }

    this.log('Verifying deployment...', 'info');

    // Wait for deployment to propagate
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      const response = await fetch(`${this.config.url}/health.json`);
      const health = await response.json();

      if (health.status !== 'healthy') {
        throw new Error(`Health check failed: ${health.status}`);
      }

      this.log(`Deployment verified - Version: ${health.version}`, 'success');
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
      if (this.environment === 'production') {
        throw error;
      }
    }
  }

  async createDeploymentRecord() {
    const record = {
      deploymentId: this.deploymentId,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      url: this.config.url,
      version: this.deploymentId,
      status: 'completed'
    };

    const deploymentsFile = 'deployments.json';
    let deployments = [];

    if (fs.existsSync(deploymentsFile)) {
      deployments = JSON.parse(fs.readFileSync(deploymentsFile, 'utf8'));
    }

    deployments.unshift(record);

    // Keep only last 50 deployments
    deployments = deployments.slice(0, 50);

    fs.writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));
    this.log(`Deployment record saved: ${this.deploymentId}`, 'success');
  }

  async deploy() {
    try {
      this.log(`Starting deployment to ${this.environment}`, 'deploy');
      this.log(`Deployment ID: ${this.deploymentId}`, 'info');

      await this.validateEnvironment();
      await this.runSecurityChecks();
      await this.runTests();
      await this.buildApplication();
      await this.deployToFirebase();
      await this.verifyDeployment();
      await this.createDeploymentRecord();

      this.log(`🎉 Deployment to ${this.environment} completed successfully!`, 'success');
      this.log(`🌐 URL: ${this.config.url}`, 'info');
      this.log(`🆔 Deployment ID: ${this.deploymentId}`, 'info');

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const environment = args[0];

  if (!environment || !ENVIRONMENTS[environment]) {
    console.log('Usage: node scripts/deploy.js <environment> [options]');
    console.log('');
    console.log('Environments:');
    Object.keys(ENVIRONMENTS).forEach(env => {
      console.log(`  ${env}`);
    });
    console.log('');
    console.log('Options:');
    console.log('  --skip-tests         Skip running tests');
    console.log('  --skip-security      Skip security checks');
    console.log('  --skip-verification  Skip deployment verification');
    console.log('  --force              Force deployment even with issues');
    process.exit(1);
  }

  const options = {
    skipTests: args.includes('--skip-tests'),
    skipSecurity: args.includes('--skip-security'),
    skipVerification: args.includes('--skip-verification'),
    force: args.includes('--force')
  };

  const deployer = new DeploymentManager(environment, options);
  deployer.deploy();
}

// For compatibility with Node.js fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  main();
}

module.exports = { DeploymentManager, ENVIRONMENTS };