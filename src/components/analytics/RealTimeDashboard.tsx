import { useEffect, useState } from 'react';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { RealTimeMetrics } from '@/lib/analytics/RealTimeMetrics';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useRealTimeData } from '@/hooks/useRealTimeData';

interface RealTimeDashboardProps {
  eventId: string;
}

export const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ eventId }) => {
  const metrics = useRealTimeData<RealTimeMetrics>(
    `analytics/${eventId}/metrics`,
    { refreshInterval: 1000 }
  );

  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Track dashboard view
    analyticsService.trackEvent('dashboard_view', { eventId });

    // Subscribe to real-time alerts
    const unsubscribe = analyticsService.subscribeToAlerts(eventId, (newAlerts) => {
      setAlerts(newAlerts);
    });

    return () => unsubscribe();
  }, [eventId]);

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity}
              title={alert.title}
              description={alert.message}
              action={alert.action}
            />
          ))}
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <h4 className="font-medium text-sm text-gray-500">Active Users</h4>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold">{metrics?.activeUsers || 0}</p>
              <Badge
                variant={metrics?.userTrend === 'up' ? 'success' : 'warning'}
                className="ml-2"
              >
                {metrics?.userChangePercent}%
              </Badge>
            </div>
          </div>
          <div className="h-32">
            <LineChart
              data={metrics?.userHistory || []}
              color={metrics?.userTrend === 'up' ? 'green' : 'yellow'}
            />
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h4 className="font-medium text-sm text-gray-500">Request Rate</h4>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold">
                {metrics?.requestsPerMinute || 0}/min
              </p>
              <Badge
                variant={metrics?.requestTrend === 'up' ? 'success' : 'warning'}
                className="ml-2"
              >
                {metrics?.requestChangePercent}%
              </Badge>
            </div>
          </div>
          <div className="h-32">
            <BarChart
              data={metrics?.requestHistory || []}
              color={metrics?.requestTrend === 'up' ? 'blue' : 'yellow'}
            />
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h4 className="font-medium text-sm text-gray-500">System Health</h4>
            <div className="mt-2">
              <p className="text-2xl font-semibold">{metrics?.systemHealth || 100}%</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Response Time</span>
                  <span>{metrics?.avgResponseTime || 0}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Error Rate</span>
                  <span>{metrics?.errorRate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-32">
            <PieChart
              data={[
                { label: 'Healthy', value: metrics?.systemHealth || 100 },
                { label: 'Issues', value: 100 - (metrics?.systemHealth || 100) }
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Custom Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics?.customMetrics?.map((metric) => (
          <Card key={metric.id}>
            <div className="p-4">
              <h4 className="font-medium text-sm text-gray-500">{metric.name}</h4>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">{metric.value}</p>
                {metric.threshold && (
                  <Badge
                    variant={metric.value > metric.threshold ? 'error' : 'success'}
                    className="ml-2"
                  >
                    {metric.value > metric.threshold ? 'Above' : 'Below'} Threshold
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{metric.description}</p>
            </div>
            {metric.history && (
              <div className="h-32">
                <LineChart
                  data={metric.history}
                  color={metric.value > (metric.threshold || 0) ? 'red' : 'green'}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}; 