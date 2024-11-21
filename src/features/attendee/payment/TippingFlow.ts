export class TippingFlow {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly queueService: QueueService,
    private readonly analyticsService: AnalyticsService
  ) {}

  async processTip(
    eventId: string,
    userId: string,
    tipData: TipRequest
  ): Promise<TipResult> {
    try {
      // Process payment
      const payment = await this.paymentService.processTip({
        eventId,
        userId,
        amount: tipData.amount,
        currency: tipData.currency,
        message: tipData.message,
        songId: tipData.songId
      });

      // Update song priority if applicable
      if (tipData.songId) {
        await this.queueService.boostPriority(eventId, tipData.songId, payment.amount);
      }

      // Track analytics
      this.analyticsService.trackEvent('tip_processed', {
        eventId,
        userId,
        amount: payment.amount,
        songId: tipData.songId
      });

      return {
        success: true,
        transactionId: payment.id,
        newQueuePosition: tipData.songId ? await this.queueService.getPosition(tipData.songId) : undefined
      };
    } catch (error) {
      this.analyticsService.trackError('tip_failed', error);
      throw error;
    }
  }

  async getLeaderboard(eventId: string): Promise<TipLeaderboard> {
    return this.analyticsService.getTipLeaderboard(eventId);
  }
} 