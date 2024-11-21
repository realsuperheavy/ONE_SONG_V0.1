import { useEffect, useMemo } from 'react';
import { BarChart } from '@/components/ui/charts/BarChart';
import { Card } from '@/components/ui/card';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import Spinner from "@/components/ui/spinner";
import { useEventActivity } from '@/hooks/useEventActivity';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface ActivityTimelineChartProps {
  eventId: string;
  dateRange?: DateRange;
  onError?: (error: Error) => void;
}

interface ChartDataPoint {
  x: string;
  y: number;
  type: string;
}

interface ActivityItem {
  timestamp: string;
  value: number;
  type: 'request' | 'vote' | 'tip' | 'play';
}

interface EventActivity {
  events: ActivityItem[];
  peakValue: number;
  average: number;
  totalActions: number;
  uniqueUsers: number;
}

export function ActivityTimelineChart({ 
  eventId, 
  dateRange,
  onError 
}: ActivityTimelineChartProps) {
  const { activity, isLoading, error } = useEventActivity<EventActivity>(eventId, dateRange);

  // Memoize chart data transformation
  const chartData = useMemo(() => 
    activity?.events?.map((item: ActivityItem): ChartDataPoint => ({
      x: new Date(item.timestamp).toLocaleTimeString(),
      y: item.value,
      type: item.type
    })) || [],
    [activity?.events]
  );

  // Report errors to analytics
  useEffect(() => {
    if (error) {
      analyticsService.trackError('activity_chart_error', {
        eventId,
        error: error.message
      });
      onError?.(error);
    }
  }, [error, eventId, onError]);

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-destructive">
          Error loading activity data: {error.message}
        </div>
      </Card>
    );
  }

  return (
    <ErrorBoundary fallback={<div>Chart rendering error</div>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Activity Timeline</h3>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              analyticsService.trackEvent('date_range_changed', {
                eventId,
                range
              });
            }}
          />
        </div>

        <div className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner className="text-[#F49620]" />
            </div>
          ) : (
            <BarChart
              data={chartData}
              xLabel="Time"
              yLabel="Activity"
              color="#F49620"
              onTooltip={(value: number, type?: string) => 
                `${value} ${type ? type.charAt(0).toUpperCase() + type.slice(1) + 's' : 'Actions'}`
              }
              barWidth={0.8}
              grouped
              onBarClick={(item) => {
                analyticsService.trackEvent('activity_bar_clicked', {
                  eventId,
                  type: item.type,
                  value: item.y
                });
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Peak Activity"
            value={activity?.peakValue ?? 0}
            subtitle="Highest point"
          />
          <MetricCard
            title="Average"
            value={Math.round(activity?.average ?? 0)}
            subtitle="Per hour"
          />
          <MetricCard
            title="Total Actions"
            value={activity?.totalActions ?? 0}
            subtitle="All activities"
          />
          <MetricCard
            title="Active Users"
            value={activity?.uniqueUsers ?? 0}
            subtitle="Unique participants"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
}

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <div className="p-4 rounded-lg bg-[#2E2F2E] border border-white/10">
      <h4 className="text-sm text-gray-400">{title}</h4>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}