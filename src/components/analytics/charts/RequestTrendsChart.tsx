import { LineChart } from '@/components/ui/charts/LineChart';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { AnalyticsData } from '@/types/components';

interface RequestTrendsChartProps {
  data: AnalyticsData['requestsByHour'];
}

export function RequestTrendsChart({ data }: RequestTrendsChartProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  const chartData = data.map(point => ({
    x: new Date(point.hour * 3600000).toLocaleTimeString(),
    y: point.count
  }));

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Request Trends</h3>
        <Select
          value={timeframe}
          onValueChange={(value: '24h' | '7d' | '30d') => setTimeframe(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-[300px]">
        <LineChart
          data={chartData}
          xLabel="Time"
          yLabel="Requests"
          color="#F49620"
          tooltipFormat={(value: number) => `${value} requests`}
        />
      </div>
    </Card>
  );
} 