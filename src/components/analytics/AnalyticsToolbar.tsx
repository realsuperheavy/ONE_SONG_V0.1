'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart } from '@/components/ui/charts/LineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface AnalyticsToolbarProps {
  eventId: string;
}

export function AnalyticsToolbar({ eventId }: AnalyticsToolbarProps) {
  const [activeView, setActiveView] = useState('realtime');

  return (
    <Card className="p-4">
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid grid-cols-3 gap-4 mb-4">
          <TabsTrigger value="realtime">
            Real-time
            <StatusIndicator status="online" className="ml-2" />
          </TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Activity</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Real-time metrics */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Request Trends</h3>
            <LineChart 
              data={[]} // Add trend data
              title="Requests Over Time"
            />
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Key Insights</h3>
            <BarChart 
              data={[]} // Add insight data
              title="Popular Genres"
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 