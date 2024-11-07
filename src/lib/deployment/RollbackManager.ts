import { ref, get, set, remove } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';

interface DeploymentState {
  version: string;
  timestamp: number;
  config: Record<string, any>;
  features: string[];
}

interface RollbackPoint {
  state: DeploymentState;
  snapshot: Record<string, any>;
  timestamp: number;
}

interface RollbackError extends Error {
  code: string;
  details?: Record<string, unknown>;
}

export class RollbackManager {
  private snapshots: Map<string, RollbackPoint>;
  private cache: Cache<RollbackPoint>;
  private readonly MAX_SNAPSHOTS = 5;

  constructor() {
    this.snapshots = new Map();
    this.cache = new Cache({ maxSize: this.MAX_SNAPSHOTS, ttl: 24 * 60 * 60 * 1000 });
  }

  async createSnapshot(version: string): Promise<void> {
    try {
      // Get current state
      const state = await this.getCurrentState();
      
      // Get data snapshot
      const snapshot = await this.captureSnapshot();

      const rollbackPoint: RollbackPoint = {
        state,
        snapshot,
        timestamp: Date.now()
      };

      // Store snapshot
      this.snapshots.set(version, rollbackPoint);
      this.cache.set(`snapshot_${version}`, rollbackPoint);

      // Maintain max snapshots
      if (this.snapshots.size > this.MAX_SNAPSHOTS) {
        const oldestKey = Array.from(this.snapshots.keys())[0];
        this.snapshots.delete(oldestKey);
        this.cache.delete(`snapshot_${oldestKey}`);
      }

      // Track snapshot creation
      analyticsService.trackEvent('rollback_snapshot_created', {
        version,
        timestamp: rollbackPoint.timestamp
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'rollback_snapshot_creation',
        version
      });
      throw error;
    }
  }

  async rollback(version: string): Promise<void> {
    try {
      const rollbackPoint = this.snapshots.get(version) || 
                          this.cache.get(`snapshot_${version}`);

      if (!rollbackPoint) {
        throw new Error(`No snapshot found for version ${version}`);
      }

      // Verify snapshot integrity
      await this.verifySnapshot(rollbackPoint);

      // Perform rollback
      await this.executeRollback(rollbackPoint);

      // Track rollback
      analyticsService.trackEvent('rollback_executed', {
        version,
        timestamp: Date.now()
      });

    } catch (err) {
      const error = err as RollbackError;
      analyticsService.trackError(error, {
        context: 'rollback_execution',
        version
      });
      throw error;
    }
  }

  private async getCurrentState(): Promise<DeploymentState> {
    const snapshot = await get(ref(rtdb, 'deployment/state'));
    return snapshot.val() as DeploymentState;
  }

  private async captureSnapshot(): Promise<Record<string, any>> {
    const snapshot = await get(ref(rtdb, '/'));
    return snapshot.val() || {};
  }

  private async verifySnapshot(rollbackPoint: RollbackPoint): Promise<void> {
    // Verify data integrity
    const currentData = await this.captureSnapshot();
    const snapshotKeys = Object.keys(rollbackPoint.snapshot);
    const currentKeys = Object.keys(currentData);

    if (snapshotKeys.length !== currentKeys.length) {
      throw new Error('Snapshot structure mismatch');
    }

    // Verify state compatibility
    const currentState = await this.getCurrentState();
    if (!this.isStateCompatible(currentState, rollbackPoint.state)) {
      throw new Error('State incompatibility detected');
    }
  }

  private async executeRollback(rollbackPoint: RollbackPoint): Promise<void> {
    // Backup current state before rollback
    const preRollbackSnapshot = await this.captureSnapshot();
    
    try {
      // Apply rollback data
      for (const [path, data] of Object.entries(rollbackPoint.snapshot)) {
        await set(ref(rtdb, path), data);
      }

      // Update state
      await set(ref(rtdb, 'deployment/state'), rollbackPoint.state);

    } catch (error) {
      // Restore from backup if rollback fails
      for (const [path, data] of Object.entries(preRollbackSnapshot)) {
        await set(ref(rtdb, path), data);
      }
      throw error;
    }
  }

  private isStateCompatible(current: DeploymentState, target: DeploymentState): boolean {
    // Check version compatibility
    const currentVersion = this.parseVersion(current.version);
    const targetVersion = this.parseVersion(target.version);
    
    if (currentVersion.major !== targetVersion.major) {
      return false;
    }

    // Check feature compatibility
    const requiredFeatures = new Set(target.features);
    const currentFeatures = new Set(current.features);
    
    for (const feature of requiredFeatures) {
      if (!currentFeatures.has(feature)) {
        return false;
      }
    }

    return true;
  }

  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch };
  }

  getAvailableSnapshots(): string[] {
    return Array.from(this.snapshots.keys());
  }

  cleanup(): void {
    this.snapshots.clear();
    this.cache.clear();
  }

  private async validateRollback(version: string): Promise<boolean> {
    try {
      // Implementation
      return true;
    } catch (err) {
      const error = err as Error;
      analyticsService.trackError(error, {
        context: 'rollback_validation',
        version
      });
      return false;
    }
  }
} 