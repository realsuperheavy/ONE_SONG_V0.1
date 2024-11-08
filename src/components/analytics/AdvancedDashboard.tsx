import { useState, useEffect } from 'react';
import { RealTimeAnalytics } from '@/lib/analytics/RealTimeAnalytics';
import { CustomMetricsManager } from '@/lib/analytics/CustomMetricsManager';
import { AlertSystem } from '@/lib/analytics/AlertSystem';
import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { Card } from '../ui/Card';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { cn } from '@/lib/utils';

interface AdvancedDashboardProps {
  eventId: string;
}

interface ChartProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  color: string;
  height?: number;
}

interface ChartData {
  label: string;
  value: number;
}

interface MetricsData {
  requestRate: Array<{time: string; requests: number}>;
  queueLength: Array<{time: string; length: number}>;
  activeUsers: Array<{time: string; users: number}>;
  responseTimes: Array<{endpoint: string; ms: number}>;
  errorRates: Array<{type: string; count: number}>;
}

interface Alert {
  id: string;
  name: string;
  description: string;
  severity: "info" | "warning" | "critical";
  timestamp: number;
}

// Add proper types for chart components
interface LineChartProps {
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  color: string;
}

interface BarChartProps {
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  color: string;
}

interface PieChartProps {
  data: ChartData[];
  labelKey: string;
  valueKey: string;
  colors: string[];
}

// Add proper types for metrics manager
interface MetricsManager {
  subscribe: (callback: (metrics: MetricsData) => void) => () => void;
}

interface AlertSystem {
  subscribe: (callback: (alerts: Alert[]) => void) => () => void;
}

const transformToChartData = (data: any[], labelKey: string, valueKey: string): ChartData[] => {
  return data.map(item => ({
    label: item[labelKey],
    value: item[valueKey]
  }));
};

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ eventId }) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const metricsManager = new CustomMetricsManager({
    updateInterval: 1000,
    cacheSize: 100,
    cacheTTL: 60000
  }) as unknown as MetricsManager;

  const alertSystem = new AlertSystem();

  useEffect(() => {
    // Start tracking event metrics
    analyticsService.trackEventMetrics(eventId);

    // Subscribe to real-time metrics
    const unsubscribeMetrics = metricsManager.subscribe((newMetrics: MetricsData) => {
      setMetrics(newMetrics);
      analyticsService.trackEvent('metrics_updated', {
        eventId,
        metrics: Object.keys(newMetrics)
      });
    });

    // Subscribe to alerts
    const unsubscribeAlerts = alertSystem.subscribe((newAlerts: Alert[]) => {
      setAlerts(newAlerts);
      analyticsService.trackEvent('alerts_updated', {
        eventId,
        alertCount: newAlerts.length
      });
    });

    return () => {
      analyticsService.stopTracking(eventId);
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, [eventId]);

  return (
    <div className="space-y-6 bg-[#1E1E1E] min-h-screen p-6">
      {/* Real-time Metrics */}
      <section aria-label="Real-time Metrics" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card gradient>
          <h3 className="text-lg font-semibold mb-2 text-white">Request Rate</h3>
          <LineChart
            data={transformToChartData(metrics?.requestRate || [], 'time', 'requests')}
            height={200}
            xAxis="time"
            yAxis="requests"
            color="#F49620"
          />
        </Card>
        
        <Card gradient>
          <h3 className="text-lg font-semibold mb-2 text-white">Queue Length</h3>
          <LineChart
            data={transformToChartData(metrics?.queueLength || [], 'time', 'length')}
            height={200}
            xAxis="time"
            yAxis="length"
            color="#F49620"
          />
        </Card>
        
        <Card gradient>
          <h3 className="text-lg font-semibold mb-2 text-white">Active Users</h3>
          <LineChart
            data={transformToChartData(metrics?.activeUsers || [], 'time', 'users')}
            height={200}
            xAxis="time"
            yAxis="users"
            color="#F49620"
          />
        </Card>
      </section>

      {/* Performance Metrics */}
      <section aria-label="Performance Metrics" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card gradient>
          <h3 className="text-lg font-semibold mb-2 text-white">Response Times</h3>
          <BarChart
            data={transformToChartData(metrics?.responseTimes || [], 'endpoint', 'ms')}
            height={250}
            xAxis="endpoint"
            yAxis="ms"
            color="#F49620"
          />
        </Card>
        
        <Card gradient>
          <h3 className="text-lg font-semibold mb-2 text-white">Error Rates</h3>
          <PieChart
            data={transformToChartData(metrics?.errorRates || [], 'type', 'count')}
            height={250}
            labelKey="type"
            valueKey="count"
            colors={['#F49620', '#FF7200', '#3E2E1B']}
          />
        </Card>
      </section>

      {/* Active Alerts */}
      <section aria-label="Active Alerts" className="mt-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-white">Active Alerts</h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-md backdrop-blur-sm",
                  alert.severity === 'critical' && "bg-red-900/50 text-red-100",
                  alert.severity === 'warning' && "bg-orange-900/50 text-orange-100",
                  alert.severity === 'info' && "bg-blue-900/50 text-blue-100"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{alert.name}</h4>
                    <p className="text-sm opacity-90">{alert.description}</p>
                  </div>
                  <span className="text-sm opacity-75">
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