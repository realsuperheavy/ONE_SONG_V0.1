import { PerformanceMonitor } from './PerformanceMonitor';
import { analyticsService } from '@/lib/firebase/services/analytics';

export class SongRequestMetrics {
  private static instance: SongRequestMetrics;
  private performanceMonitor: PerformanceMonitor;

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  static getInstance(): SongRequestMetrics {
    if (!SongRequestMetrics.instance) {
      SongRequestMetrics.instance = new SongRequestMetrics();
    }
    return SongRequestMetrics.instance;
  }

  startRequest(eventId: string): void {
    this.performanceMonitor.startOperation('songRequest');
    analyticsService.trackEvent('song_request_started', {
      eventId,
      timestamp: Date.now()
    });
  }

  trackSearchTime(duration: number): void {
    this.performanceMonitor.addMetric('searchTime', duration);
    analyticsService.trackEvent('song_search_completed', {
      duration,
      timestamp: Date.now()
    });
  }

  trackPreviewLoad(success: boolean, duration: number): void {
    this.performanceMonitor.addMetric('previewLoadTime', duration);
    analyticsService.trackEvent('preview_load_completed', {
      success,
      duration,
      timestamp: Date.now()
    });
  }

  completeRequest(eventId: string, success: boolean): void {
    this.performanceMonitor.endOperation('songRequest');
    const metrics = this.performanceMonitor.getMetrics();
    
    analyticsService.trackEvent('song_request_completed', {
      eventId,
      success,
      metrics,
      timestamp: Date.now()
    });
  }

  getMetrics() {
    return {
      averageSearchTime: this.performanceMonitor.getAverageMetric('searchTime'),
      averagePreviewLoadTime: this.performanceMonitor.getAverageMetric('previewLoadTime'),
      averageRequestTime: this.performanceMonitor.getAverageMetric('songRequest'),
      totalRequests: this.performanceMonitor.getTotalOperations('songRequest'),
      successRate: this.performanceMonitor.getSuccessRate('songRequest')
    };
  }
} 