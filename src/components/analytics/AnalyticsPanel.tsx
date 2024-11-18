import { Card } from '@/components/ui/card';
import { LineChart, BarChart } from '@/components/ui/charts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { RequestTrendsChart } from "./charts/RequestTrendsChart";
import { GenreDistributionChart } from "./charts/GenreDistributionChart";
import { ActivityTimelineChart } from "./charts/ActivityTimelineChart";

interface AnalyticsPanelProps {
  eventId: string;
  'aria-label'?: string;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ eventId }) => {
  const { 
    requestTrends,
    genreDistribution,
    audienceEngagement,
    tipStats,
    isLoading,
    error 
  } = useAnalytics(eventId);

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div>Error loading analytics: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Request Trends</h3>
              <RequestTrendsChart data={requestTrends} />
            </Card>
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Genre Distribution</h3>
              <GenreDistributionChart data={genreDistribution} />
            </Card>
          </div>
        </TabsContent>

        {/* Additional tab contents... */}
      </Tabs>
    </div>
  );
}; 