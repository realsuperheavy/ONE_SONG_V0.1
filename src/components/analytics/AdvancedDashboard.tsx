import { useState, useEffect } from 'react';
import { RealTimeAnalytics } from '@/lib/analytics/RealTimeAnalytics';
import { CustomMetricsManager } from '@/lib/analytics/CustomMetricsManager';
import { AlertSystem } from '@/lib/analytics/AlertSystem';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { Card } from '../ui/Card';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface AdvancedDashboardProps {
  eventId: string;
}

interface RealTimeMetrics {
  userActivity: Array<{timestamp: number; count: number}>;
  responseLatency: Array<{endpoint: string; ms: number}>;
  errorRates: Array<{type: string; count: number}>;
}

interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ eventId }) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const metricsManager = new CustomMetricsManager();
  const alertSystem = new AlertSystem();
  const analytics = new RealTimeAnalytics({
    metricsManager,
    alertSystem,
    updateInterval: 1000
  });

  useEffect(() => {
    // Start tracking event metrics
    analytics.trackEventMetrics(eventId);

    // Subscribe to real-time metrics
    const unsubscribeMetrics = metricsManager.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      analyticsService.trackEvent('metrics_updated', {
        eventId,
        metrics: Object.keys(newMetrics)
      });
    });

    // Subscribe to alerts
    const unsubscribeAlerts = alertSystem.subscribe((newAlerts) => {
      setAlerts(newAlerts);
      analyticsService.trackEvent('alerts_updated', {
        eventId,
        alertCount: newAlerts.length
      });
    });

    return () => {
      analytics.stopTracking(eventId);
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, [eventId]);

  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <section aria-label="Real-time Metrics" className="grid grid-cols-3 gap-4">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Request Rate</h3>
          <LineChart
            data={metrics?.requestRate || []}
            height={200}
            xAxis="time"
            yAxis="requests"
          />
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold mb-2">Queue Length</h3>
          <LineChart
            data={metrics?.queueLength || []}
            height={200}
            xAxis="time"
            yAxis="length"
          />
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold mb-2">Active Users</h3>
          <LineChart
            data={metrics?.activeUsers || []}
            height={200}
            xAxis="time"
            yAxis="users"
          />
        </Card>
      </section>

      {/* Performance Metrics */}
      <section aria-label="Performance Metrics" className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Response Times</h3>
          <BarChart
            data={metrics?.responseTimes || []}
            height={250}
            xAxis="endpoint"
            yAxis="ms"
          />
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold mb-2">Error Rates</h3>
          <PieChart
            data={metrics?.errorRates || []}
            height={250}
            labelKey="type"
            valueKey="count"
          />
        </Card>
      </section>

      {/* Active Alerts */}
      <section aria-label="Active Alerts" className="mt-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-md ${
                  alert.severity === 'critical' 
                    ? 'bg-red-100 text-red-800'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{alert.name}</h4>
                    <p className="text-sm">{alert.description}</p>
                  </div>
                  <span className="text-sm">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}; 