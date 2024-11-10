import { getAnalytics, logEvent } from '@firebase/analytics';
import * as Sentry from '@sentry/nextjs';
import pino from 'pino';
import { analytics } from '@/lib/firebase/config';
import type { User, Event, SongRequest } from '@/types/models';

interface PerformanceMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  fid: number;
}

interface ErrorReport {
  error: Error;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
}

interface UserActivity {
  userId: string;
  action: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export class ProductionMonitor {
  private logger: pino.Logger;
  private static instance: ProductionMonitor;

  private constructor() {
    this.logger = pino({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    });

    // Initialize Sentry if in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.2,
        environment: process.env.NODE_ENV
      });
    }
  }

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  // Performance Monitoring
  trackPerformance(metrics: Partial<PerformanceMetrics>): void {
    if (analytics) {
      logEvent(analytics, 'performance_metrics', metrics);
    }
    
    this.logger.info({ type: 'performance', metrics });
  }

  // Error Tracking
  trackError({ error, context, severity, userId }: ErrorReport): void {
    this.logger.error({
      type: 'error',
      error: error.message,
      stack: error.stack,
      context,
      severity,
      userId
    });

    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        scope.setLevel(severity);
        scope.setContext('error_context', context);
        if (userId) scope.setUser({ id: userId });
        Sentry.captureException(error);
      });
    }
  }

  // User Activity Monitoring
  trackUserActivity(activity: UserActivity): void {
    if (analytics) {
      logEvent(analytics, 'user_activity', {
        ...activity,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.info({
      type: 'user_activity',
      ...activity
    });
  }

  // Request Monitoring
  trackRequest(request: SongRequest, status: 'created' | 'approved' | 'rejected' | 'played'): void {
    if (analytics) {
      logEvent(analytics, 'song_request', {
        requestId: request.id,
        eventId: request.eventId,
        status,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.info({
      type: 'request',
      requestId: request.id,
      status,
      metadata: request.metadata
    });
  }

  // Event Monitoring
  trackEventMetrics(event: Event, metrics: Record<string, number>): void {
    if (analytics) {
      logEvent(analytics, 'event_metrics', {
        eventId: event.id,
        ...metrics,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.info({
      type: 'event_metrics',
      eventId: event.id,
      metrics
    });
  }

  // System Health Check
  async checkSystemHealth(): Promise<Record<string, boolean>> {
    const health = {
      firebase: true,
      spotify: true,
      stripe: true
    };

    try {
      // Add health checks for each service
      // Implementation will depend on your specific needs
    } catch (error) {
      this.trackError({
        error: error as Error,
        context: { service: 'health_check' },
        severity: 'high'
      });
    }

    return health;
  }

  // Resource Usage Monitoring
  trackResourceUsage(metrics: Record<string, number>): void {
    if (analytics) {
      logEvent(analytics, 'resource_usage', {
        ...metrics,
        timestamp: new Date().toISOString()
      });
    }

    this.logger.info({
      type: 'resource_usage',
      metrics
    });
  }
}

// Export singleton instance
export const productionMonitor = ProductionMonitor.getInstance(); 