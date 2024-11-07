import { openDB, IDBPDatabase } from 'idb';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';

interface OfflineConfig {
  maxCacheSize: number;
  syncInterval: number;
  retryAttempts: number;
  dbVersion: number;
}

interface SyncResult {
  success: boolean;
  error?: Error;
  timestamp: number;
}

export class OfflineManager {
  private db: IDBPDatabase | null = null;
  private cache: Cache<any>;
  private syncQueue: Map<string, QueuedOperation>;
  private isOnline: boolean;
  private config: OfflineConfig;
  private syncTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      maxCacheSize: config.maxCacheSize || 1000,
      syncInterval: config.syncInterval || 30000, // 30 seconds
      retryAttempts: config.retryAttempts || 3,
      dbVersion: config.dbVersion || 1
    };

    this.cache = new Cache({ maxSize: this.config.maxCacheSize });
    this.syncQueue = new Map();
    this.isOnline = navigator.onLine;
    
    this.initializeDatabase();
    this.setupEventListeners();
    this.startSyncInterval();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.db = await openDB('onesong-offline', this.config.dbVersion, {
        upgrade(db) {
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('requests')) {
            db.createObjectStore('requests', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('queue')) {
            db.createObjectStore('queue', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('userData')) {
            db.createObjectStore('userData', { keyPath: 'id' });
          }
        }
      });

      analyticsService.trackEvent('offline_db_initialized', {
        version: this.config.dbVersion
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'offline_db_initialization'
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    // Listen for sync messages from service worker
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        this.handleSyncComplete(event.data.operationId);
      }
    });
  }

  private async handleNetworkChange(isOnline: boolean): Promise<void> {
    this.isOnline = isOnline;
    
    if (isOnline) {
      await this.processSyncQueue();
    }

    analyticsService.trackEvent('network_status_change', {
      status: isOnline ? 'online' : 'offline'
    });
  }

  async queueOperation(operation: QueuedOperation): Promise<void> {
    try {
      // Store operation in IndexedDB
      await this.db?.put('requests', {
        ...operation,
        timestamp: Date.now(),
        attempts: 0
      });

      // Add to sync queue
      this.syncQueue.set(operation.id, operation);

      // Try immediate sync if online
      if (this.isOnline) {
        await this.processSyncQueue();
      }

      analyticsService.trackEvent('operation_queued', {
        type: operation.type,
        id: operation.id
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'queue_operation',
        operationId: operation.id
      });
      throw error;
    }
  }

  private async processSyncQueue(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    if (!this.isOnline || !this.syncQueue.size) return results;

    const operations = Array.from(this.syncQueue.values());
    
    for (const operation of operations) {
      try {
        const result = await this.processOperation(operation);
        results.push(result);
        this.syncQueue.delete(operation.id);
        await this.db?.delete('requests', operation.id);

        analyticsService.trackEvent('operation_synced', {
          type: operation.type,
          id: operation.id
        });
      } catch (error) {
        await this.handleSyncError(operation, error as Error);
      }
    }
    return results;
  }

  private async processOperation(operation: QueuedOperation): Promise<SyncResult> {
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await registration.sync.register(`sync-${operation.id}`);
    } else {
      // Fallback for browsers without background sync
      await this.performSync(operation);
    }

    return { success: true, timestamp: Date.now() };
  }

  private async performSync(operation: QueuedOperation): Promise<void> {
    const response = await fetch(operation.url, {
      method: operation.method,
      headers: operation.headers,
      body: operation.body
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  private async handleSyncError(operation: QueuedOperation, error: Error): Promise<void> {
    const storedOp = await this.db?.get('requests', operation.id);
    
    if (storedOp && storedOp.attempts < this.config.retryAttempts) {
      // Update attempt count and requeue
      await this.db?.put('requests', {
        ...storedOp,
        attempts: storedOp.attempts + 1,
        lastError: error.message
      });
    } else {
      // Max attempts reached, remove from queue
      this.syncQueue.delete(operation.id);
      await this.db?.delete('requests', operation.id);
      
      analyticsService.trackError(error, {
        context: 'sync_failed',
        operationId: operation.id,
        attempts: storedOp?.attempts || 0
      });
    }
  }

  private async handleSyncComplete(operationId: string): Promise<void> {
    this.syncQueue.delete(operationId);
    await this.db?.delete('requests', operationId);
    
    analyticsService.trackEvent('sync_complete', {
      operationId
    });
  }

  private startSyncInterval(): void {
    this.syncTimeout = setInterval(
      () => this.processSyncQueue(),
      this.config.syncInterval
    );
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const cached = this.cache.get(key);
    if (cached) return cached;

    // Check IndexedDB
    return await this.db?.get('userData', key) || null;
  }

  async setCachedData<T>(key: string, data: T): Promise<void> {
    // Store in memory cache
    this.cache.set(key, data);

    // Store in IndexedDB
    await this.db?.put('userData', {
      id: key,
      data,
      timestamp: Date.now()
    });
  }

  cleanup(): void {
    if (this.syncTimeout) {
      clearInterval(this.syncTimeout);
    }
    this.cache.clear();
    this.syncQueue.clear();
    this.db?.close();
  }
}

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp?: number;
  attempts?: number;
  lastError?: string;
} 