export class SongRequestFlow {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly requestService: RequestService,
    private readonly rateLimiter: RateLimiter,
    private readonly analyticsService: AnalyticsService,
    private readonly realTimeService: RealTimeService
  ) {}

  async searchSongs(query: string): Promise<SongSearchResult[]> {
    try {
      // Get songs with autocomplete
      const results = await this.spotifyService.searchTracks(query, {
        limit: 10,
        market: 'US',
        includePreview: true
      });

      // Track search analytics
      this.analyticsService.trackEvent('song_search', {
        query,
        resultCount: results.length
      });

      return results;
    } catch (error) {
      this.analyticsService.trackError('song_search_failed', error);
      throw error;
    }
  }

  async previewSong(trackId: string): Promise<void> {
    const previewUrl = await this.spotifyService.getPreviewUrl(trackId);
    if (previewUrl) {
      await this.spotifyService.playPreview(previewUrl);
    } else {
      throw new Error('Preview not available');
    }
  }

  async submitRequest(
    eventId: string,
    userId: string,
    songData: SongRequest
  ): Promise<RequestResult> {
    try {
      // Check rate limits
      await this.rateLimiter.checkUserLimit(userId, 'song_request');

      // Create request
      const request = await this.requestService.createRequest({
        eventId,
        userId,
        song: songData,
        status: 'pending',
        timestamp: Date.now()
      });

      // Notify DJ in real-time
      await this.realTimeService.notifyDJ(eventId, 'new_request', request);

      // Track analytics
      this.analyticsService.trackEvent('song_requested', {
        eventId,
        songId: songData.id,
        userId
      });

      return {
        requestId: request.id,
        status: request.status,
        position: request.position
      };
    } catch (error) {
      this.analyticsService.trackError('request_submission_failed', error);
      throw error;
    }
  }
} 