'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { AnimatedList } from '@/components/ui/list/AnimatedList';
import { StatusIndicator } from '@/components/ui/status/StatusSystem';
import { useQueueManager } from '@/lib/queue/QueueManager';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { FirebaseDebugger } from '@/debug/firebase/FirebaseDebugger';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';

interface RequestListProps {
  eventId: string;
  onRequestSelect?: (request: SongRequest) => void;
}

export function RequestList({ eventId, onRequestSelect }: RequestListProps) {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queueManager = useQueueManager(eventId);
  const performanceMonitor = new PerformanceMetricsCollector();
  const debugger = new FirebaseDebugger(eventId);

  const handleRequestSelect = useCallback((request: SongRequest) => {
    performanceMonitor.startOperation('requestSelect');
    
    try {
      onRequestSelect?.(request);
      
      analyticsService.trackEvent('request_selected', {
        eventId,
        requestId: request.id,
        songTitle: request.song.title,
        position: request.queuePosition
      });

      performanceMonitor.endOperation('requestSelect');
    } catch (error) {
      performanceMonitor.trackError('requestSelect');
      analyticsService.trackError(error as Error, {
        context: 'request_select',
        requestId: request.id
      });
    }
  }, [eventId, onRequestSelect]);

  const handleReorder = useCallback(async (newOrder: SongRequest[]) => {
    performanceMonitor.startOperation('reorderRequests');
    
    try {
      await queueManager.reorderQueue(newOrder.map(r => r.id));
      
      analyticsService.trackEvent('requests_reordered', {
        eventId,
        requestCount: newOrder.length
      });

      performanceMonitor.endOperation('reorderRequests');
    } catch (error) {
      performanceMonitor.trackError('reorderRequests');
      setError(error as Error);
      
      analyticsService.trackError(error as Error, {
        context: 'reorder_requests',
        eventId
      });
    }
  }, [eventId, queueManager]);

  useEffect(() => {
    performanceMonitor.startOperation('requestListInit');

    const unsubscribe = queueManager.subscribeToQueue(async (queue) => {
      try {
        setRequests(queue);
        setLoading(false);
        setError(null);

        // Monitor performance
        const diagnosis = await debugger.diagnoseRealTimeIssue();
        if (diagnosis.healthStatus !== 'healthy') {
          analyticsService.trackEvent('queue_performance_issue', {
            eventId,
            diagnosis
          });
        }

        performanceMonitor.endOperation('requestListInit');
        performanceMonitor.trackMetric('queueSize', queue.length);
      } catch (error) {
        setError(error as Error);
        performanceMonitor.trackError('requestListInit');
        
        analyticsService.trackError(error as Error, {
          context: 'request_list_subscription',
          eventId
        });
      }
    });

    return () => {
      unsubscribe();
      performanceMonitor.dispose();
    };
  }, [eventId, queueManager, debugger]);

  if (loading) {
    return (
      <Card className="p-4">
        <StatusIndicator type="loading" message="Loading requests..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <StatusIndicator 
          type="error" 
          message="Failed to load requests. Please try again." 
        />
      </Card>
    );
  }

  return (
    <AnimatedList
      items={requests}
      onReorder={handleReorder}
      keyExtractor={(request) => request.id}
      renderItem={(request) => (
        <Card
          key={request.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleRequestSelect(request)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{request.song.title}</h3>
              <p className="text-sm text-gray-500">{request.song.artist}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                #{request.queuePosition}
              </span>
              <StatusIndicator
                type={request.status}
                message={request.status}
              />
            </div>
          </div>
        </Card>
      )}
    />
  );
} 