describe('Song Request System', () => {
  let songRequestFlow: SongRequestFlow;

  beforeEach(() => {
    songRequestFlow = new SongRequestFlow(
      mockSpotifyService,
      mockRequestService,
      mockRateLimiter,
      mockAnalyticsService,
      mockRealTimeService
    );
  });

  it('should search songs with autocomplete', async () => {
    const results = await songRequestFlow.searchSongs('test query');
    expect(results).toHaveLength(10);
    expect(results[0]).toHaveProperty('previewUrl');
  });

  it('should enforce rate limits', async () => {
    // Make multiple requests
    await songRequestFlow.submitRequest(eventId, userId, mockSongData);
    
    // Next request should fail
    await expect(
      songRequestFlow.submitRequest(eventId, userId, mockSongData)
    ).rejects.toThrow('Rate limit exceeded');
  });

  // More test cases...
}); 