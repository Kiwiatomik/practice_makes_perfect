#!/usr/bin/env node

/**
 * Rollback Script for Practice Makes Perfect
 * Handles automated rollback to previous versions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RollbackManager {
  constructor(environment, options = {}) {
    this.environment = environment;
    this.options = options;
    this.rollbackId = `rollback-${Date.now()}-${environment}`;

    this.config = {
      staging: {
        firebaseConfig: 'firebase.staging.json',
        firebaseProject: 'practice-makes-perfect-staging',
        url: 'https://practice-makes-perfect-staging.web.app'
      },
      production: {
        firebaseConfig: 'firebase.production.json',
        firebaseProject: 'practice-makes-perfect-5e85e',
        url: 'https://practice-makes-perfect-5e85e.web.app'
      }
    }[environment];

    if (!this.config) {
      throw new Error(`Invalid environment: ${environment}`);
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      rollback: '🔄'
    }[level] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async getCurrentVersion() {
    try {
      const response = await fetch(`${this.config.url}/health.json`);
      const health = await response.json();
      return health.version || 'unknown';
    } catch (error) {
      this.log(`Could not get current version: ${error.message}`, 'warning');
      return 'unknown';
    }
  }

  async getTargetVersion() {
    const deploymentsFile = 'deployments.json';

    if (!fs.existsSync(deploymentsFile)) {
      throw new Error('No deployment history found. Cannot determine rollback target.');
    }

    const deployments = JSON.parse(fs.readFileSync(deploymentsFile, 'utf8'));
    const envDeployments = deployments.filter(d => d.environment === this.environment);

    if (envDeployments.length < 2) {
      throw new Error('Not enough deployment history for rollback.');
    }

    if (this.options.targetVersion) {
      const target = envDeployments.find(d => d.version === this.options.targetVersion);
      if (!target) {
        throw new Error(`Target version ${this.options.targetVersion} not found in deployment history.`);
      }
      return target;
    }

    // Return the second most recent deployment (previous version)
    return envDeployments[1];
  }

  async validateRollback(currentVersion, targetVersion) {
    if (currentVersion === targetVersion.version) {
      throw new Error('Current version and target version are the same. No rollback necessary.');
    }

    this.log(`Rollback plan: ${currentVersion} → ${targetVersion.version}`, 'info');

    if (!this.options.force) {
      this.log('Rollback validation passed', 'success');
    }
  }

  async executeRollback(targetVersion) {
    this.log(`Executing rollback to version ${targetVersion.version}...`, 'rollback');

    try {
      // Switch to target git commit/tag
      if (targetVersion.gitRef) {
        execSync(`git checkout ${targetVersion.gitRef}`, { stdio: 'inherit' });
      }

      // Install dependencies (in case package.json changed)
      execSync('npm ci', { stdio: 'inherit' });

      // Build the target version
      const buildEnv = {
        ...process.env,
        VITE_ENVIRONMENT: this.environment,
        VITE_APP_VERSION: this.rollbackId
      };

      execSync('npm run build', {
        stdio: 'inherit',
        env: buildEnv
      });

      // Deploy to preview channel first for safety (unless emergency)
      if (!this.options.emergency) {
        this.log('Deploying to preview channel for verification...', 'info');

        execSync(`firebase use ${this.config.firebaseProject}`, { stdio: 'inherit' });

        const previewChannel = `rollback-${this.rollbackId}`;
        const deployOutput = execSync(
          `firebase hosting:channel:deploy ${previewChannel} --config=${this.config.firebaseConfig} --json`,
          {
            stdio: 'pipe',
            env: { ...process.env, FIREBASE_TOKEN: process.env.FIREBASE_TOKEN }
          }
        );

        const deployResult = JSON.parse(deployOutput.toString());
        const previewUrl = deployResult.result.url;

        this.log(`Preview deployed: ${previewUrl}`, 'success');

        // Verify preview
        await new Promise(resolve => setTimeout(resolve, 30000));
        const response = await fetch(`${previewUrl}/health.json`);
        const health = await response.json();

        if (health.status !== 'healthy') {
          throw new Error(`Preview health check failed: ${health.status}`);
        }

        // Clone preview to live
        this.log('Promoting preview to live...', 'rollback');
        execSync(
          `firebase hosting:clone ${previewChannel}:live --config=${this.config.firebaseConfig}`,
          {
            stdio: 'inherit',
            env: { ...process.env, FIREBASE_TOKEN: process.env.FIREBASE_TOKEN }
          }
        );
      } else {
        // Emergency rollback - direct deployment
        this.log('EMERGENCY ROLLBACK - Direct deployment', 'warning');
        execSync(`firebase use ${this.config.firebaseProject}`, { stdio: 'inherit' });
        execSync(`firebase deploy --config=${this.config.firebaseConfig}`, {
          stdio: 'inherit',
          env: { ...process.env, FIREBASE_TOKEN: process.env.FIREBASE_TOKEN }
        });
      }

      this.log('Rollback deployment completed', 'success');
    } catch (error) {
      throw new Error(`Rollback execution failed: ${error.message}`);
    }
  }

  async verifyRollback() {
    this.log('Verifying rollback...', 'info');

    // Wait for deployment to propagate
    await new Promise(resolve => setTimeout(resolve, 60000));

    try {
      const response = await fetch(`${this.config.url}/health.json`);
      const health = await response.json();

      if (health.status !== 'healthy') {
        throw new Error(`Rollback verification failed: ${health.status}`);
      }

      this.log(`Rollback verified - Current version: ${health.version}`, 'success');
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateDeploymentRecord(targetVersion) {
    const record = {
      deploymentId: this.rollbackId,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      url: this.config.url,
      version: targetVersion.version,
      status: 'rollback-completed',
      rolledBackFrom: targetVersion.version,
      reason: this.options.reason || 'manual-rollback'
    };

    const deploymentsFile = 'deployments.json';
    let deployments = [];

    if (fs.existsSync(deploymentsFile)) {
      deployments = JSON.parse(fs.readFileSync(deploymentsFile, 'utf8'));
    }

    deployments.unshift(record);
    deployments = deployments.slice(0, 50);

    fs.writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));
    this.log(`Rollback record saved: ${this.rollbackId}`, 'success');
  }

  async rollback() {
    try {
      this.log(`Starting rollback for ${this.environment}`, 'rollback');
      this.log(`Rollback ID: ${this.rollbackId}`, 'info');

      const currentVersion = await this.getCurrentVersion();
      this.log(`Current version: ${currentVersion}`, 'info');

      const targetVersion = await this.getTargetVersion();
      this.log(`Target version: ${targetVersion.version}`, 'info');

      await this.validateRollback(currentVersion, targetVersion);
      await this.executeRollback(targetVersion);
      await this.verifyRollback();
      await this.updateDeploymentRecord(targetVersion);

      this.log(`🎉 Rollback completed successfully!`, 'success');
      this.log(`🌐 URL: ${this.config.url}`, 'info');
      this.log(`🔄 Rolled back to: ${targetVersion.version}`, 'info');

    } catch (error) {
      this.log(`Rollback failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const environment = args[0];

  if (!environment || !['staging', 'production'].includes(environment)) {
    console.log('Usage: node scripts/rollback.js <environment> [options]');
    console.log('');
    console.log('Environments: staging, production');
    console.log('');
    console.log('Options:');
    console.log('  --target <version>   Specific version to rollback to');
    console.log('  --reason <reason>    Reason for rollback');
    console.log('  --emergency          Emergency rollback (skip preview)');
    console.log('  --force              Force rollback even with warnings');
    process.exit(1);
  }

  const options = {
    targetVersion: args.includes('--target') ? args[args.indexOf('--target') + 1] : null,
    reason: args.includes('--reason') ? args[args.indexOf('--reason') + 1] : null,
    emergency: args.includes('--emergency'),
    force: args.includes('--force')
  };

  const rollbackManager = new RollbackManager(environment, options);
  rollbackManager.rollback();
}

// For compatibility with Node.js fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  main();
}

module.exports = { RollbackManager };