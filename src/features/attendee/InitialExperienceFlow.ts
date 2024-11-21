export class InitialExperienceFlow {
  constructor(
    private readonly queueService: QueueService,
    private readonly playerService: PlayerService,
    private readonly tippingService: TippingService,
    private readonly realTimeService: RealTimeService
  ) {}

  async initialize(eventId: string): Promise<InitialState> {
    try {
      // Fetch all initial data in parallel
      const [
        currentSong,
        queue,
        tippingConfig
      ] = await Promise.all([
        this.playerService.getCurrentSong(eventId),
        this.queueService.getQueue(eventId),
        this.tippingService.getConfiguration(eventId)
      ]);

      // Set up real-time listeners
      await this.setupRealTimeListeners(eventId);

      return {
        currentSong,
        queue,
        tippingEnabled: tippingConfig.enabled,
        quickTipAmounts: tippingConfig.quickAmounts
      };
    } catch (error) {
      this.analyticsService.trackError('initial_experience_failed', error);
      throw error;
    }
  }

  private async setupRealTimeListeners(eventId: string): Promise<void> {
    // Listen for queue updates
    this.realTimeService.on('queue.updated', (update) => {
      this.queueService.updateLocalQueue(update);
    });

    // Listen for current song changes
    this.realTimeService.on('player.songChanged', (song) => {
      this.playerService.updateCurrentSong(song);
    });

    // Listen for tip notifications
    this.realTimeService.on('tip.received', (tip) => {
      this.tippingService.handleTipNotification(tip);
    });
  }
} 