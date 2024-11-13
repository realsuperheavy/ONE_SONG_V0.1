'use client';

import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts/LineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { useEventStore } from '@/store/event';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface AnalyticsDisplayProps {
  eventId: string;
}

export function AnalyticsDisplay({ eventId }: AnalyticsDisplayProps) {
  const { currentEvent } = useEventStore();

  const metrics = {
    requestsOverTime: [
      { x: '1h', y: 12 },
      { x: '2h', y: 19 },
      { x: '3h', y: 15 },
      { x: '4h', y: 25 },
    ],
    popularGenres: [
      { label: 'Pop', value: 45 },
      { label: 'Hip Hop', value: 35 },
      { label: 'Rock', value: 20 },
    ],
    audienceEngagement: {
      totalRequests: 156,
      uniqueRequesters: 89,
      averageWaitTime: '12min'
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Requests Over Time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Requests Timeline</h3>
        <LineChart
          data={metrics.requestsOverTime}
          title="Requests per Hour"
          color="#F49620"
        />
      </Card>

      {/* Popular Genres */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Genres</h3>
        <BarChart
          data={metrics.popularGenres}
          xLabel="Genre"
          yLabel="Requests"
          color="#F49620"
        />
      </Card>

      {/* Audience Engagement */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Audience Engagement</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold">{metrics.audienceEngagement.totalRequests}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unique Requesters</p>
            <p className="text-2xl font-bold">{metrics.audienceEngagement.uniqueRequesters}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Wait Time</p>
            <p className="text-2xl font-bold">{metrics.audienceEngagement.averageWaitTime}</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 