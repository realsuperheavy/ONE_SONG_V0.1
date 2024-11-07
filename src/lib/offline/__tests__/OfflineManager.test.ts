import { OfflineManager } from '../OfflineManager';
import { Cache } from '@/lib/cache';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { openDB, IDBPDatabase } from 'idb';

// Mock dependencies
vi.mock('idb');
vi.mock('@/lib/cache');
vi.mock('@/lib/firebase/services/analytics');

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;
  let mockDB: IDBPDatabase;
  
  const defaultConfig = {
    maxCacheSize: 100,
    syncInterval: 1000,
    retryAttempts: 3,
    dbVersion: 1
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock IndexedDB
    mockDB = {
      createObjectStore: vi.fn(),
      transaction: vi.fn(),
      close: vi.fn(),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false)
      }
    } as unknown as IDBPDatabase;
    
    (openDB as jest.Mock).mockResolvedValue(mockDB);
    
    // Initialize manager
    offlineManager = new OfflineManager(defaultConfig);
  });

  afterEach(async () => {
    await offlineManager.cleanup();
  });

  describe('Initialization', () => {
    it('initializes with default configuration', () => {
      expect(openDB).toHaveBeenCalledWith(
        'onesong-offline',
        defaultConfig.dbVersion,
        expect.any(Object)
      );
      expect(Cache).toHaveBeenCalledWith({
        maxSize: defaultConfig.maxCacheSize
      });
    });

    it('creates required object stores', async () => {
      const upgradeCallback = (openDB as jest.Mock).mock.calls[0][2].upgrade;
      await upgradeCallback(mockDB);

      expect(mockDB.createObjectStore).toHaveBeenCalledWith('requests', {
        keyPath: 'id'
      });
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('queue', {
        keyPath: 'id'
      });
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('userData', {
        keyPath: 'id'
      });
    });

    it('tracks initialization in analytics', () => {
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'offline_db_initialized',
        expect.any(Object)
      );
    });
  });

  describe('Network State Management', () => {
    it('handles online state transition', async () => {
      const mockOnline = new Event('online');
      window.dispatchEvent(mockOnline);

      await vi.runAllTimersAsync();

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'network_status_change',
        { status: 'online' }
      );
    });

    it('handles offline state transition', async () => {
      const mockOffline = new Event('offline');
      window.dispatchEvent(mockOffline);

      await vi.runAllTimersAsync();

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'network_status_change',
        { status: 'offline' }
      );
    });
  });

  describe('Operation Queueing', () => {
    const mockOperation = {
      id: 'test-op-1',
      type: 'create',
      url: '/api/test',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    };

    it('queues operations when offline', async () => {
      // Simulate offline state
      window.dispatchEvent(new Event('offline'));
      
      await offlineManager.queueOperation(mockOperation);

      const transaction = await mockDB.transaction('requests', 'readwrite');
      const store = transaction.objectStore('requests');
      
      expect(store.put).toHaveBeenCalledWith({
        ...mockOperation,
        timestamp: expect.any(Number),
        attempts: 0
      });
    });

    it('attempts immediate sync when online', async () => {
      const processSyncQueueSpy = vi.spyOn(offlineManager as any, 'processSyncQueue');
      
      window.dispatchEvent(new Event('online'));
      await offlineManager.queueOperation(mockOperation);

      expect(processSyncQueueSpy).toHaveBeenCalled();
    });

    it('handles operation failures gracefully', async () => {
      const error = new Error('Sync failed');
      vi.spyOn(offlineManager as any, 'processOperation').mockRejectedValueOnce(error);

      await offlineManager.queueOperation(mockOperation);

      expect(analyticsService.trackError).toHaveBeenCalledWith(error, {
        context: 'queue_operation',
        operationId: mockOperation.id
      });
    });
  });

  describe('Sync Management', () => {
    it('processes sync queue on network recovery', async () => {
      const mockOperations = [
        { id: 'op1', type: 'create' },
        { id: 'op2', type: 'update' }
      ];

      // Setup mock queue
      const store = await mockDB.transaction('requests', 'readwrite')
        .objectStore('requests');
      for (const op of mockOperations) {
        await store.put(op);
      }

      // Simulate coming online
      window.dispatchEvent(new Event('online'));
      await vi.runAllTimersAsync();

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'operation_synced',
        expect.objectContaining({
          type: mockOperations[0].type,
          id: mockOperations[0].id
        })
      );
    });

    it('retries failed operations up to configured limit', async () => {
      const mockOperation = { id: 'retry-op', type: 'create' };
      const error = new Error('Sync failed');

      vi.spyOn(offlineManager as any, 'processOperation')
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      await offlineManager.queueOperation(mockOperation);
      await vi.runAllTimersAsync();

      const store = await mockDB.transaction('requests', 'readwrite')
        .objectStore('requests');
      const updatedOp = await store.get(mockOperation.id);

      expect(updatedOp.attempts).toBe(2);
    });
  });

  describe('Cache Management', () => {
    it('retrieves data from memory cache first', async () => {
      const mockData = { test: true };
      const mockKey = 'test-key';

      vi.spyOn(Cache.prototype, 'get').mockReturnValueOnce(mockData);

      const result = await offlineManager.getCachedData(mockKey);

      expect(result).toBe(mockData);
      expect(Cache.prototype.get).toHaveBeenCalledWith(mockKey);
    });

    it('falls back to IndexedDB when not in memory cache', async () => {
      const mockData = { test: true };
      const mockKey = 'test-key';

      vi.spyOn(Cache.prototype, 'get').mockReturnValueOnce(null);
      const store = await mockDB.transaction('userData', 'readonly')
        .objectStore('userData');
      store.get.mockResolvedValueOnce(mockData);

      const result = await offlineManager.getCachedData(mockKey);

      expect(result).toBe(mockData);
    });

    it('stores data in both memory and IndexedDB', async () => {
      const mockData = { test: true };
      const mockKey = 'test-key';

      await offlineManager.setCachedData(mockKey, mockData);

      expect(Cache.prototype.set).toHaveBeenCalledWith(mockKey, mockData);
      
      const store = await mockDB.transaction('userData', 'readwrite')
        .objectStore('userData');
      expect(store.put).toHaveBeenCalledWith({
        id: mockKey,
        data: mockData,
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Cleanup', () => {
    it('properly cleans up resources', async () => {
      await offlineManager.cleanup();

      expect(Cache.prototype.clear).toHaveBeenCalled();
      expect(mockDB.close).toHaveBeenCalled();
    });

    it('cancels ongoing sync interval', async () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      
      await offlineManager.cleanup();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
}); 