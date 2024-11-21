export class AnalyticsDashboard {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly realTimeService: RealTimeService,
    private readonly metricsService: MetricsService
  ) {}

  async initialize(eventId: string): Promise<DashboardData> {
    // Fetch all analytics data in parallel
    const [
      attendance,
      songMetrics,
      tipMetrics,
      genreDistribution
    ] = await Promise.all([
      this.getAttendanceMetrics(eventId),
      this.getSongMetrics(eventId),
      this.getTipMetrics(eventId),
      this.getGenreDistribution(eventId)
    ]);

    // Set up real-time metric updates
    this.setupRealTimeMetrics(eventId);

    return {
      attendance,
      songMetrics,
      tipMetrics,
      genreDistribution
    };
  }

  private async getAttendanceMetrics(eventId: string): Promise<AttendanceMetrics> {
    const metrics = await this.metricsService.getEventMetrics(eventId);
    return {
      currentAttendees: metrics.activeUsers,
      peakAttendance: metrics.peakUsers,
      averageStayTime: metrics.averageSessionDuration
    };
  }

  private setupRealTimeMetrics(eventId: string): void {
    this.realTimeService.subscribe(`events/${eventId}/metrics`, (update) => {
      this.updateDashboardMetrics(update);
    });
  }
} 