import { ref, get, set, update } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { Cache } from '@/lib/cache';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { RealTimeDebugger } from '@/debug/workflows/RealTimeDebugger';

interface Snapshot {
  id: string;
  timestamp: number;
  data: any;
  metadata: {
    version: string;
    checksum: string;
    source: 'auto' | 'manual';
    userId?: string;
  };
}

interface RollbackConfig {
  maxSnapshots: number;
  snapshotInterval: number;
  retentionPeriod: number;
  validateRollback: boolean;
}

interface RollbackResult {
  success: boolean;
  snapshotId: string;
  timestamp: number;
  operations: number;
}

export class RollbackManager {
  private cache: Cache<Snapshot>;
  private debugger: RealTimeDebugger;
  private readonly config: RollbackConfig;
  private snapshotInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<RollbackConfig> = {}) {
    this.config = {
      maxSnapshots: config.maxSnapshots || 50,
      snapshotInterval: config.snapshotInterval || 5 * 60 * 1000, // 5 minutes
      retentionPeriod: config.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      validateRollback: config.validateRollback ?? true
    };

    this.cache = new Cache({ maxSize: this.config.maxSnapshots });
    this.debugger = new RealTimeDebugger();
    this.initializeAutoSnapshots();
  }

  async createSnapshot(path: string, metadata: Partial<Snapshot['metadata']> = {}): Promise<string> {
    try {
      const snapshot: Snapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: Date.now(),
        data: await this.captureData(path),
        metadata: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          checksum: await this.generateChecksum(path),
          source: metadata.source || 'manual',
          ...metadata
        }
      };

      // Store snapshot
      await set(ref(rtdb, `snapshots/${path}/${snapshot.id}`), snapshot);
      this.cache.set(`${path}:${snapshot.id}`, snapshot);

      // Track snapshot creation
      analyticsService.trackEvent('snapshot_created', {
        path,
        snapshotId: snapshot.id,
        metadata: snapshot.metadata
      });

      return snapshot.id;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'create_snapshot',
        path
      });
      throw error;
    }
  }

  async rollback(path: string, snapshotId: string): Promise<RollbackResult> {
    try {
      // Get snapshot
      const snapshot = await this.getSnapshot(path, snapshotId);
      if (!snapshot) throw new Error('Snapshot not found');

      // Validate rollback if enabled
      if (this.config.validateRollback) {
        await this.validateRollback(path, snapshot.data);
      }

      // Create pre-rollback snapshot
      const preRollbackId = await this.createSnapshot(path, {
        source: 'auto',
        metadata: { reason: 'pre_rollback' }
      });

      // Execute rollback
      await this.executeRollback(path, snapshot);

      // Verify rollback
      await this.verifyRollback(path, snapshot);

      // Track successful rollback
      analyticsService.trackEvent('rollback_success', {
        path,
        snapshotId,
        preRollbackId
      });

      return {
        success: true,
        snapshotId,
        timestamp: Date.now(),
        operations: 0
      };

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'rollback',
        path,
        snapshotId
      });
      throw error;
    }
  }

  private async captureData(path: string): Promise<any> {
    const snapshot = await get(ref(rtdb, path));
    return snapshot.val();
  }

  private async generateChecksum(path: string): Promise<string> {
    const data = await this.captureData(path);
    return crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(JSON.stringify(data))
    ).then(buffer => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  }

  private async validateRollback(path: string, data: any): Promise<boolean> {
    // Check data integrity
    const currentChecksum = await this.generateChecksum(path);
    const snapshotChecksum = await this.generateChecksum(data);
    
    if (currentChecksum === snapshotChecksum) {
      throw new Error('Current state matches snapshot');
    }

    // Check for dependent data
    const dependencies = await this.checkDependencies(path);
    if (dependencies.hasConflicts) {
      throw new Error('Dependent data would be affected by rollback');
    }

    // Verify system health
    const diagnosis = await this.debugger.diagnoseRealTimeIssue();
    if (diagnosis.severity === 'critical') {
      throw new Error('System health check failed');
    }

    return true;
  }

  private async executeRollback(path: string, snapshot: Snapshot): Promise<void> {
    // Prepare rollback operations
    const operations = this.prepareRollbackOperations(path, snapshot.data);
    
    // Execute in batches
    for (const batch of this.batchOperations(operations)) {
      await update(ref(rtdb), batch);
    }
  }

  private async verifyRollback(path: string, snapshot: Snapshot): Promise<void> {
    // Verify data
    const currentData = await this.captureData(path);
    const currentChecksum = await this.generateChecksum(currentData);
    const snapshotChecksum = await this.generateChecksum(snapshot.data);

    if (currentChecksum !== snapshotChecksum) {
      throw new Error('Rollback verification failed');
    }

    // Verify system health
    const diagnosis = await this.debugger.diagnoseRealTimeIssue();
    if (diagnosis.severity !== 'low') {
      throw new Error('Post-rollback health check failed');
    }
  }

  private async getSnapshot(path: string, snapshotId: string): Promise<Snapshot | null> {
    // Check cache first
    const cached = this.cache.get(`${path}:${snapshotId}`);
    if (cached) return cached;

    // Get from database
    const snapshot = await get(ref(rtdb, `snapshots/${path}/${snapshotId}`));
    const data = snapshot.val();

    if (data) {
      this.cache.set(`${path}:${snapshotId}`, data);
    }

    return data;
  }

  private async checkDependencies(path: string): Promise<{ 
    hasConflicts: boolean;
    dependencies: string[];
  }> {
    // Implementation would check for data dependencies
    // This is a simplified version
    return {
      hasConflicts: false,
      dependencies: []
    };
  }

  private prepareRollbackOperations(path: string, data: any): Record<string, any> {
    const operations: Record<string, any> = {};
    
    const addOperation = (currentPath: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
          addOperation(`${currentPath}/${key}`, val);
        });
      } else {
        operations[currentPath] = value;
      }
    };

    addOperation(path, data);
    return operations;
  }

  private batchOperations(operations: Record<string, any>): Record<string, any>[] {
    const BATCH_SIZE = 500;
    const batches: Record<string, any>[] = [];
    const entries = Object.entries(operations);

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = Object.fromEntries(entries.slice(i, i + BATCH_SIZE));
      batches.push(batch);
    }

    return batches;
  }

  private initializeAutoSnapshots(): void {
    this.snapshotInterval = setInterval(async () => {
      try {
        const paths = await this.getActivePaths();
        for (const path of paths) {
          await this.createSnapshot(path, { source: 'auto' });
        }
      } catch (error) {
        analyticsService.trackError(error as Error, {
          context: 'auto_snapshot'
        });
      }
    }, this.config.snapshotInterval);
  }

  private async getActivePaths(): Promise<string[]> {
    // Implementation would determine which paths need snapshots
    // This is a simplified version
    return ['events', 'queue', 'requests'];
  }

  cleanup(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    this.cache.clear();
  }
} 