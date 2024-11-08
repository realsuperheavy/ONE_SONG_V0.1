import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { webhookService } from '@/lib/webhooks/config';
import { LineChart, BarChart } from '@/components/ui/Charts';
import { formatDistanceToNow } from 'date-fns';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface WebhookMetrics {
  totalDeliveries: number;
  successRate: number;
  averageLatency: number;
  errorRate: number;
  activeWebhooks: number;
}

interface DeliveryStats {
  timestamp: number;
  success: number;
  failed: number;
  latency: number;
}

interface WebhookError {
  id: string;
  webhookId: string;
  message: string;
  timestamp: number;
  resolved: boolean;
}

export const WebhookStatusDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<WebhookMetrics>({
    totalDeliveries: 0,
    successRate: 0,
    averageLatency: 0,
    errorRate: 0,
    activeWebhooks: 0
  });
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats[]>([]);
  const [recentErrors, setRecentErrors] = useState<WebhookError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load initial metrics
        const initialMetrics = await analyticsService.getWebhookMetrics();
        setMetrics(initialMetrics);

        // Load delivery stats for charts
        const stats = await analyticsService.getWebhookDeliveryStats();
        setDeliveryStats(stats);

        // Load recent errors
        const errors = await analyticsService.getRecentWebhookErrors();
        setRecentErrors(errors);

        // Subscribe to real-time updates
        const unsubscribe = analyticsService.subscribeToWebhookMetrics(
          (updatedMetrics) => {
            setMetrics(prev => ({
              ...prev,
              ...updatedMetrics
            }));
          }
        );

        return () => unsubscribe();
      } catch (err) {
        const error = err as Error;
        setError('Failed to load dashboard data');
        analyticsService.trackError(error, {
          context: 'webhook_dashboard_load'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleRetryFailedDeliveries = async () => {
    try {
      await webhookService.retryFailedDeliveries();
      analyticsService.trackEvent('webhook_retries_initiated', {
        count: recentErrors.length
      });
    } catch (err) {
      setError('Failed to retry deliveries');
      analyticsService.trackError(err as Error, {
        context: 'webhook_retry'
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Active Webhooks</div>
          <div className="text-2xl font-bold">{metrics.activeWebhooks}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Success Rate</div>
          <div className="text-2xl font-bold">
            {metrics.successRate.toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Avg. Latency</div>
          <div className="text-2xl font-bold">
            {metrics.averageLatency.toFixed(0)}ms
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Error Rate</div>
          <div className="text-2xl font-bold">
            {metrics.errorRate.toFixed(1)}%
          </div>
        </Card>
      </div>

      {/* Delivery Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Delivery Trends</h3>
        <LineChart
          data={deliveryStats.map(stat => ({
            timestamp: stat.timestamp,
            value: stat.success / (stat.success + stat.failed) * 100
          }))}
          height={200}
        />
      </Card>

      {/* Latency Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Latency Distribution</h3>
        <BarChart
          data={deliveryStats.map(stat => ({
            timestamp: stat.timestamp,
            value: stat.latency
          }))}
          height={200}
        />
      </Card>

      {/* Recent Errors */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Recent Errors</h3>
          {recentErrors.length > 0 && (
            <Button
              size="sm"
              onClick={handleRetryFailedDeliveries}
            >
              Retry Failed Deliveries
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {recentErrors.map((error) => (
            <div
              key={error.id}
              className="flex justify-between items-start p-4 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium">{error.message}</div>
                <div className="text-sm text-gray-500">
                  Webhook: {error.webhookId}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(error.timestamp)} ago
                </div>
              </div>
              <Badge
                variant={error.resolved ? 'success' : 'error'}
              >
                {error.resolved ? 'Resolved' : 'Unresolved'}
              </Badge>
            </div>
          ))}
          {recentErrors.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No recent errors
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}; 