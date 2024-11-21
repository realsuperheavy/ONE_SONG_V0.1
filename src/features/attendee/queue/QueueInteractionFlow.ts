export class QueueInteractionFlow {
  constructor(
    private readonly queueService: QueueService,
    private readonly voteService: VoteService,
    private readonly historyService: HistoryService,
    private readonly realTimeService: RealTimeService
  ) {}

  async getQueueStatus(eventId: string): Promise<QueueStatus> {
    const [currentQueue, userVotes] = await Promise.all([
      this.queueService.getCurrentQueue(eventId),
      this.voteService.getUserVotes(eventId)
    ]);

    return {
      currentSong: currentQueue.nowPlaying,
      upcomingSongs: currentQueue.upcoming,
      userVotes
    };
  }

  async voteSong(
    eventId: string,
    songId: string,
    userId: string,
    voteType: 'up' | 'down'
  ): Promise<VoteResult> {
    try {
      // Record vote
      const vote = await this.voteService.recordVote({
        eventId,
        songId,
        userId,
        type: voteType,
        timestamp: Date.now()
      });

      // Update queue priority
      await this.queueService.updatePriority(eventId, songId, vote.impact);

      // Notify real-time updates
      await this.realTimeService.broadcast(eventId, 'queue.vote.updated', {
        songId,
        newVoteCount: vote.totalVotes
      });

      return {
        success: true,
        newPosition: vote.newPosition,
        totalVotes: vote.totalVotes
      };
    } catch (error) {
      this.analyticsService.trackError('vote_failed', error);
      throw error;
    }
  }

  async getPlayHistory(eventId: string): Promise<PlayHistoryItem[]> {
    return this.historyService.getEventHistory(eventId, {
      limit: 50,
      includeRequests: true
    });
  }

  // Set up real-time listeners
  async initializeRealTimeUpdates(eventId: string): Promise<void> {
    this.realTimeService.subscribe(`events/${eventId}/queue`, (update) => {
      this.handleQueueUpdate(update);
    });

    this.realTimeService.subscribe(`events/${eventId}/votes`, (update) => {
      this.handleVoteUpdate(update);
    });
  }

  private handleQueueUpdate(update: QueueUpdate): void {
    // Update local queue state
    this.queueService.updateLocalQueue(update);
  }

  private handleVoteUpdate(update: VoteUpdate): void {
    // Update local vote counts
    this.voteService.updateLocalVotes(update);
  }
} 