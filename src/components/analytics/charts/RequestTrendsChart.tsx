import { LineChart } from '@/components/ui/charts/LineChart';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useState } from 'react';
import { RequestAnalytics } from '@/types/analytics';

interface RequestTrendsChartProps {
  data: RequestAnalytics['requestsByHour'];
}

export function RequestTrendsChart({ data }: RequestTrendsChartProps) {
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week'>('hour');

  const chartData = Object.entries(data || {}).map(([hour, count]) => ({
    x: parseInt(hour),
    y: count
  })).sort((a, b) => a.x - b.x);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Request Trends</h3>
        <Select
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as typeof timeframe)}
          className="w-32"
        >
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
        </Select>
      </div>

      <div className="h-[300px]">
        <LineChart
          data={chartData}
          xLabel="Time"
          yLabel="Requests"
          color="#F49620"
          tooltipFormat={(value) => `${value} requests`}
        />
      </div>
    </div>
  );
} 