import { BarChart } from '@/components/ui/charts/BarChart';
import { Card } from '@/components/ui/card';
import { DateRange } from '@/components/ui/date-range-picker';
import { useEventActivity } from '@/hooks/useEventActivity';

interface ActivityTimelineChartProps {
  eventId: string;
  dateRange?: DateRange;
}

export function ActivityTimelineChart({ eventId, dateRange }: ActivityTimelineChartProps) {
  const { activity, isLoading } = useEventActivity(eventId, dateRange);

  const chartData = activity?.map(item => ({
    x: new Date(item.timestamp).toLocaleTimeString(),
    y: item.value,
    type: item.type
  })) || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Activity Timeline</h3>

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
            tooltipFormat={(value, type) => `${value} ${type}`}
            barWidth={0.8}
            grouped
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Peak Activity"
          value={activity?.peakValue || 0}
          subtitle="Highest point"
        />
        <MetricCard
          title="Average"
          value={activity?.average || 0}
          subtitle="Per hour"
        />
        <MetricCard
          title="Total Actions"
          value={activity?.totalActions || 0}
          subtitle="All activities"
        />
        <MetricCard
          title="Active Users"
          value={activity?.uniqueUsers || 0}
          subtitle="Unique participants"
        />
      </div>
    </div>
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