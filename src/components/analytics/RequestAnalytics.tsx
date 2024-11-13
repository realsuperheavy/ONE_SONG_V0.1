'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts/LineChart';
import { PieChart } from '@/components/ui/charts/PieChart';
import { StatusIndicator } from '@/components/ui/status/StatusSystem';
import { useQueueManager } from '@/lib/queue/QueueManager';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { FirebaseDebugger } from '@/debug/firebase/FirebaseDebugger';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface RequestMetrics {
  requestsPerHour: Array<{ x: string; y: number }>;
  genreDistribution: Array<{ label: string; value: number }>;
  averageWaitTime: number;
  totalRequests: number;
}

interface RequestAnalyticsProps {
  eventId: string;
}

export function RequestAnalytics({ eventId }: RequestAnalyticsProps) {
  const [metrics, setMetrics] = useState<RequestMetrics>({
    requestsPerHour: [],
    genreDistribution: [],
    averageWaitTime: 0,
    totalRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const queueManager = useQueueManager(eventId);
  const performanceMonitor = new PerformanceMetricsCollector();
  const debugger = new FirebaseDebugger(eventId);

  const calculateMetrics = useCallback((queue: any[]) => {
    performanceMonitor.startOperation('calculateMetrics');

    try {
      // Calculate requests per hour
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

      // Calculate average wait time
      const waitTimes = queue
        .filter(request => request.playedAt)
        .map(request => request.playedAt - request.addedAt);
      
      const averageWaitTime = waitTimes.length > 0
        ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
        : 0;

      setMetrics({
        requestsPerHour: hourlyRequests,
        genreDistribution,
        averageWaitTime,
        totalRequests: queue.length
      });

      performanceMonitor.endOperation('calculateMetrics');
      
      analyticsService.trackEvent('metrics_calculated', {
        eventId,
        totalRequests: queue.length,
        averageWaitTime
      });
    } catch (error) {
      performanceMonitor.trackError('calculateMetrics');
      analyticsService.trackError(error as Error, {
        context: 'calculate_metrics',
        eventId
      });
    }
  }, [eventId, performanceMonitor]);

  useEffect(() => {
    const unsubscribe = queueManager.subscribeToQueue(async (queue) => {
      calculateMetrics(queue);
      setLoading(false);

      // Monitor performance
      const diagnosis = await debugger.diagnoseRealTimeIssue();
      if (diagnosis.healthStatus !== 'healthy') {
        analyticsService.trackEvent('performance_issue', {
          eventId,
          diagnosis
        });
      }
    });

    return () => {
      unsubscribe();
      performanceMonitor.dispose();
    };
  }, [eventId, queueManager, calculateMetrics, debugger]);

  if (loading) {
    return (
      <Card className="p-4">
        <StatusIndicator type="loading" message="Loading analytics..." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Requests Over Time</h3>
        <LineChart
          data={metrics.requestsPerHour}
          title="Hourly Requests"
          color="#F49620"
        />
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Genre Distribution</h3>
        <PieChart
          data={metrics.genreDistribution}
          title="Genres"
        />
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Total Requests</h3>
          <p className="text-3xl font-bold">{metrics.totalRequests}</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Average Wait Time</h3>
          <p className="text-3xl font-bold">
            {Math.round(metrics.averageWaitTime / 1000 / 60)} min
          </p>
        </Card>
      </div>
    </div>
  );
}