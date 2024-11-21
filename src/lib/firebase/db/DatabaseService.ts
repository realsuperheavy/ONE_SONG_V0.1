export class DatabaseService {
  constructor(
    private readonly db = getFirestore(),
    private readonly rtdb = getDatabase(),
    private readonly cache = new DatabaseCache(),
    private readonly metricsService: MetricsService
  ) {}

  async setupDatabase(): Promise<void> {
    // Enable offline persistence
    await enableIndexedDbPersistence(this.db);

    // Configure cache size
    await this.db.settings({
      cacheSizeBytes: 100000000 // 100MB cache
    });

    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }

  async optimizeQueries(): Promise<void> {
    // Create composite indexes
    await this.createIndexes([
      {
        collection: 'events',
        fields: ['status', 'startTime']
      },
      {
        collection: 'requests',
        fields: ['eventId', 'status', 'timestamp']
      }
    ]);

    // Set up caching rules
    this.setupCachingRules();
  }

  private setupCachingRules(): void {
    // Cache frequently accessed collections
    const cachingRules = [
      { collection: 'events', ttl: 5 * 60 * 1000 }, // 5 minutes
      { collection: 'queue', ttl: 1 * 60 * 1000 },  // 1 minute
      { collection: 'users', ttl: 30 * 60 * 1000 }  // 30 minutes
    ];

    cachingRules.forEach(rule => {
      this.cache.setRule(rule.collection, rule.ttl);
    });
  }

  async backupDatabase(): Promise<void> {
    const timestamp = Date.now();
    const backupRef = ref(this.rtdb, `backups/${timestamp}`);

    try {
      // Export critical collections
      const collections = ['events', 'users', 'queue', 'requests'];
      const backupData = await this.exportCollections(collections);

      // Store backup
      await set(backupRef, {
        data: backupData,
        timestamp,
        status: 'complete'
      });

      this.metricsService.trackEvent('database_backup_completed', {
        collections,
        timestamp
      });
    } catch (error) {
      this.metricsService.trackError('database_backup_failed', error);
      throw error;
    }
  }
} 