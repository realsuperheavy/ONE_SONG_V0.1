export class LoadTestRunner {
  constructor(
    private readonly config: LoadTestConfig,
    private readonly metrics: MetricsService
  ) {}

  async runLoadTest(): Promise<LoadTestResults> {
    const startTime = Date.now();
    const results: LoadTestMetric[] = [];

    try {
      // Create virtual users
      const users = await this.createVirtualUsers(this.config.userCount);

      // Run concurrent requests
      const requests = users.map(user => 
        this.simulateUserActions(user, this.config.duration)
      );

      // Wait for all requests to complete
      const userResults = await Promise.all(requests);

      // Aggregate results
      results.push(...userResults.flat());

      return this.analyzeResults(results, Date.now() - startTime);
    } catch (error) {
      this.metrics.trackError('load_test_failed', error);
      throw error;
    }
  }

  private async simulateUserActions(
    user: VirtualUser,
    duration: number
  ): Promise<LoadTestMetric[]> {
    const metrics: LoadTestMetric[] = [];
    const endTime = Date.now() + duration;

    while (Date.now() < endTime) {
      // Simulate random user action
      const action = this.getRandomUserAction();
      const result = await this.executeAction(user, action);
      metrics.push(result);

      // Add think time
      await this.delay(this.getRandomThinkTime());
    }

    return metrics;
  }

  private analyzeResults(
    results: LoadTestMetric[],
    totalDuration: number
  ): LoadTestResults {
    return {
      totalRequests: results.length,
      successRate: this.calculateSuccessRate(results),
      averageResponseTime: this.calculateAverageResponseTime(results),
      p95ResponseTime: this.calculatePercentile(results, 95),
      errorRate: this.calculateErrorRate(results),
      throughput: results.length / (totalDuration / 1000)
    };
  }
} 