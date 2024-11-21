'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts/LineChart';
import { PieChart } from '@/components/ui/charts/PieChart';
import { StatusIndicator } from '@/components/ui/status/StatusSystem';
import { RequestAnalytics } from './RequestAnalytics';
import { useQueueManager } from '@/lib/queue/QueueManager';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { FirebaseDebugger } from '@/debug/firebase/FirebaseDebugger';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface AnalyticsDashboardProps {
  eventId: string;
}

interface DashboardMetrics {
  requestTrends: Array<{ x: string; y: number }>;
  genreDistribution: Array<{ label: string; value: number }>;
  performanceMetrics: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
  };
}

export function AnalyticsDashboard({ eventId }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    requestTrends: [],
    genreDistribution: [],
    performanceMetrics: {
      responseTime: 0,
      errorRate: 0,
      memoryUsage: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const queueManager = useQueueManager(eventId);
  const performanceMonitor = new PerformanceMetricsCollector();
  const firebaseDebugger = new FirebaseDebugger(eventId);

  const updateMetrics = useCallback(async (queue: any[]) => {
    performanceMonitor.startOperation('updateMetrics');

    try {
      // Calculate request trends
      const hourlyRequests = queue.reduce((acc, request) => {
        const hour = new Date(request.addedAt).getHours();
        const existing = acc.find(r => r.x === `${hour}:00`);
        if (existing) {
          existing.y++;
        } else {
          acc.push({ x: `${hour}:00`, y: 1 });
        }
        return acc;
      }, [] as Array<{ x: string; y: number }>);

      // Calculate genre distribution
      const genres = queue.reduce((acc, request) => {
        const genre = request.song.genre || 'Unknown';
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const genreDistribution = Object.entries(genres).map(([label, value]) => ({
        label,
        value
      }));

      // Get performance metrics
      const perfMetrics = performanceMonitor.getMetrics();
      const diagnosis = await firebaseDebugger.diagnoseRealTimeIssue();

      setMetrics({
        requestTrends: hourlyRequests,
        genreDistribution,
        performanceMetrics: {
          responseTime: perfMetrics.responseTime,
          errorRate: diagnosis.errors.length / queue.length,
          memoryUsage: perfMetrics.memoryUsage
        }
      });

      performanceMonitor.endOperation('updateMetrics');
      
      analyticsService.trackEvent('analytics_updated', {
        eventId,
        queueSize: queue.length,
        metrics: perfMetrics
      });
    } catch (error) {
      performanceMonitor.trackError('updateMetrics');
      analyticsService.trackError(error as Error, {
        context: 'analytics_update',
        eventId
      });
    }
  }, [eventId, performanceMonitor, firebaseDebugger]);

  useEffect(() => {
    const unsubscribe = queueManager.subscribeToQueue(async (queue) => {
      await updateMetrics(queue);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      performanceMonitor.dispose();
    };
  }, [queueManager, updateMetrics]);

  if (loading) {
    return (
      <Card className="p-4">
        <StatusIndicator type="loading" message="Loading analytics..." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Request Trends</h3>
        <LineChart
          data={metrics.requestTrends}
          title="Requests per Hour"
          color="#F49620"
          height={300}
        />
      </Card>

      {/* Genre Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Genre Distribution</h3>
        <PieChart
          data={metrics.genreDistribution}
          height={300}
        />
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">Response Time</h4>
          <p className="text-2xl font-bold">
            {Math.round(metrics.performanceMetrics.responseTime)}ms
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">Error Rate</h4>
          <p className="text-2xl font-bold">
            {(metrics.performanceMetrics.errorRate * 100).toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
          <p className="text-2xl font-bold">
            {(metrics.performanceMetrics.memoryUsage * 100).toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Request Analytics */}
      <RequestAnalytics eventId={eventId} />
    </div>
  );
} 