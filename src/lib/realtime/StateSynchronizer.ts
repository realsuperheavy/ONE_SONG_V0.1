export class StateSynchronizer {
  private readonly stateCache: StateCache;
  private readonly conflictResolver: ConflictResolver;

  constructor(
    private readonly db: FirebaseFirestore.Firestore,
    private readonly realTimeDb: FirebaseDatabase,
    private readonly metricsService: MetricsService
  ) {
    this.stateCache = new StateCache();
    this.conflictResolver = new ConflictResolver();
  }

  async syncQueueOrder(
    eventId: string,
    updates: QueueOrderUpdate[]
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Optimistic update
      this.stateCache.updateQueueOrder(eventId, updates);

      // Persist to Firestore
      await this.db.runTransaction(async (transaction) => {
        const queueRef = this.db.collection('events').doc(eventId).collection('queue');
        
        // Check for conflicts
        const currentState = await transaction.get(queueRef);
        const conflicts = this.conflictResolver.detectConflicts(
          currentState.data(),
          updates
        );

        if (conflicts.length > 0) {
          // Resolve conflicts using last-write-wins
          const resolvedUpdates = this.conflictResolver.resolveConflicts(
            conflicts,
            updates
          );
          
          // Apply resolved updates
          resolvedUpdates.forEach(update => {
            transaction.update(queueRef.doc(update.id), update);
          });
        } else {
          // Apply updates directly
          updates.forEach(update => {
            transaction.update(queueRef.doc(update.id), update);
          });
        }
      });

      // Sync to real-time database
      await this.realTimeDb.ref(`events/${eventId}/queue`).update(
        this.formatUpdatesForRealTime(updates)
      );

      // Track metrics
      this.metricsService.recordHistogram('queue_sync_duration', Date.now() - startTime);

    } catch (error) {
      // Handle sync failure
      await this.handleSyncFailure(eventId, updates, error);
      throw error;
    }
  }

  private async handleSyncFailure(
    eventId: string,
    updates: QueueOrderUpdate[],
    error: Error
  ): Promise<void> {
    // Revert optimistic updates
    this.stateCache.revertQueueOrder(eventId);

    // Log error
    this.metricsService.incrementCounter('sync_failures', {
      eventId,
      errorType: error.name
    });

    // Store failed updates for retry
    await this.storeFailedUpdates(eventId, updates);
  }
} 