export class RequestModerationFlow {
  constructor(
    private readonly requestService: RequestService,
    private readonly queueService: QueueService,
    private readonly blocklistService: BlocklistService,
    private readonly notificationService: NotificationService
  ) {}

  async handleRequest(
    eventId: string, 
    requestId: string, 
    action: 'approve' | 'reject'
  ): Promise<void> {
    const request = await this.requestService.getRequest(requestId);

    if (action === 'approve') {
      // Add to queue
      await this.queueService.addTrack(eventId, {
        trackId: request.trackId,
        requestId: request.id,
        userId: request.userId,
        timestamp: Date.now()
      });

      // Update request status
      await this.requestService.updateStatus(requestId, 'approved');

      // Notify requester
      await this.notificationService.notifyUser(request.userId, 'request_approved', {
        trackName: request.track.name
      });
    } else {
      await this.requestService.updateStatus(requestId, 'rejected');
      await this.notificationService.notifyUser(request.userId, 'request_rejected', {
        trackName: request.track.name
      });
    }
  }

  async handleBatchRequests(
    eventId: string,
    requestIds: string[],
    action: 'approve' | 'reject'
  ): Promise<void> {
    await Promise.all(
      requestIds.map(id => this.handleRequest(eventId, id, action))
    );
  }

  async updateBlocklist(
    eventId: string,
    updates: BlocklistUpdate
  ): Promise<void> {
    await this.blocklistService.updateBlocklist(eventId, updates);
    await this.realTimeService.broadcast(eventId, 'blocklist.updated', updates);
  }
} 