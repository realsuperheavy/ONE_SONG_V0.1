import { performance } from 'perf_hooks';
import { firebaseServices } from '@/lib/firebase/services';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface LoadTestConfig {
  users: number;
  duration: number;
  rampUp: number;
  thinkTime: number;
}

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
}

export class LoadTestRunner {
  private metrics: {
    responseTimes: number[];
    errors: Error[];
    startTime: number;
  };

  constructor(private config: LoadTestConfig) {
    this.metrics = {
      responseTimes: [],
      errors: [],
      startTime: 0
    };
  }

  async runTest(): Promise<LoadTestMetrics> {
    this.metrics.startTime = performance.now();
    const users = Array.from({ length: this.config.users }, (_, i) => i);
    
    try {
      // Start virtual users
      const userPromises = users.map((userId) => 
        this.simulateUser(userId)
      );

      await Promise.all(userPromises);

      return this.calculateMetrics();
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'load_test',
        users: this.config.users,
        duration: this.config.duration
      });
      throw error;
    }
  }

  private async simulateUser(userId: number): Promise<void> {
    const startDelay = (userId / this.config.users) * this.config.rampUp;
    await new Promise(resolve => setTimeout(resolve, startDelay));

    const endTime = performance.now() + this.config.duration;
    
    while (performance.now() < endTime) {
      try {
        await this.executeUserActions(userId);
        await new Promise(resolve => setTimeout(resolve, this.config.thinkTime));
      } catch (error) {
        this.metrics.errors.push(error as Error);
      }
    }
  }

  private async executeUserActions(userId: number): Promise<void> {
    const actions = [
      this.searchTracks,
      this.makeRequest,
      this.voteRequest,
      this.checkQueue
    ];

    for (const action of actions) {
      const start = performance.now();
      try {
        await action(userId);
        this.metrics.responseTimes.push(performance.now() - start);
      } catch (error) {
        this.metrics.errors.push(error as Error);
      }
    }
  }

  private async searchTracks(userId: number): Promise<void> {
    const searchTerms = ['rock', 'pop', 'dance', 'hip hop'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    await firebaseServices.search.tracks(term);
  }

  private async makeRequest(userId: number): Promise<void> {
    const request = {
      userId: `user_${userId}`,
      song: {
        id: `song_${Math.random()}`,
        title: 'Test Song',
        artist: 'Test Artist'
      }
    };
    await firebaseServices.requests.create(request);
  }

  private async voteRequest(userId: number): Promise<void> {
    const requests = await firebaseServices.requests.getAll();
    if (requests.length > 0) {
      const randomRequest = requests[Math.floor(Math.random() * requests.length)];
      await firebaseServices.requests.vote(randomRequest.id, `user_${userId}`);
    }
  }

  private async checkQueue(userId: number): Promise<void> {
    await firebaseServices.queue.getQueue('test_event');
  }

  private calculateMetrics(): LoadTestMetrics {
    const totalRequests = this.metrics.responseTimes.length;
    const failedRequests = this.metrics.errors.length;
    
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);

    return {
      totalRequests,
      successfulRequests: totalRequests - failedRequests,
      failedRequests,
      averageResponseTime: this.average(sortedTimes),
      p95ResponseTime: sortedTimes[p95Index] || 0,
      errorRate: failedRequests / totalRequests
    };
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
} 