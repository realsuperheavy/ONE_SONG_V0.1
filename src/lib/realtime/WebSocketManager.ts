export class WebSocketManager {
  private readonly connections: Map<string, WebSocket>;
  private readonly heartbeatInterval = 30000; // 30 seconds
  private readonly reconnectDelay = 1000; // 1 second initial delay
  private readonly maxReconnectDelay = 30000; // 30 seconds max delay

  constructor(
    private readonly metricsService: MetricsService,
    private readonly presenceService: PresenceService,
    private readonly analyticsService: AnalyticsService
  ) {
    this.connections = new Map();
    this.startHeartbeat();
  }

  async connect(eventId: string, userId: string): Promise<void> {
    try {
      const connection = await this.createConnection(eventId);
      this.connections.set(this.getConnectionKey(eventId, userId), connection);
      
      // Track user presence
      await this.presenceService.markUserPresent(eventId, userId);
      
      // Set up event listeners
      this.setupEventListeners(connection, eventId, userId);
      
      // Track metrics
      this.metricsService.incrementCounter('websocket_connections', {
        eventId,
        userId
      });
    } catch (error) {
      this.handleConnectionError(error, eventId, userId);
    }
  }

  private setupEventListeners(
    connection: WebSocket,
    eventId: string,
    userId: string
  ): void {
    // Queue updates
    connection.on('queue.updated', (data) => {
      this.handleQueueUpdate(eventId, data);
    });

    // Request status changes
    connection.on('request.status_changed', (data) => {
      this.handleRequestUpdate(eventId, data);
    });

    // Tip notifications
    connection.on('tip.received', (data) => {
      this.handleTipNotification(eventId, data);
    });

    // Connection status
    connection.on('close', () => {
      this.handleDisconnect(eventId, userId);
    });
  }

  private async handleDisconnect(eventId: string, userId: string): Promise<void> {
    await this.presenceService.markUserOffline(eventId, userId);
    this.attemptReconnection(eventId, userId);
  }

  private async attemptReconnection(
    eventId: string,
    userId: string,
    attempt = 1
  ): Promise<void> {
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, attempt - 1),
      this.maxReconnectDelay
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.connect(eventId, userId);
    } catch (error) {
      if (attempt < 5) { // Max 5 retry attempts
        this.attemptReconnection(eventId, userId, attempt + 1);
      } else {
        this.analyticsService.trackError('websocket_reconnection_failed', {
          eventId,
          userId,
          attempts: attempt
        });
      }
    }
  }
} 