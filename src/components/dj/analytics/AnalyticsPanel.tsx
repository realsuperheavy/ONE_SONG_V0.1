import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { useEventData } from '@/hooks/useEventData';
import { RequestAnalytics } from '@/types/analytics';
import { 
  BarChart, 
  LineChart, 
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';

interface AnalyticsPanelProps {
  eventId: string;
}

export function AnalyticsPanel({ eventId }: AnalyticsPanelProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [analytics, setAnalytics] = useState<RequestAnalytics>();
  const { event } = useEventData(eventId);

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await analyticsService.getRequestAnalytics(eventId, dateRange);
      setAnalytics(data);
    };
    loadAnalytics();
  }, [eventId, dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Event Analytics</h2>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Requests"
          value={analytics?.totalRequests || 0}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={+10}
        />
        <StatsCard
          title="Active Users"
          value={event?.stats.attendeeCount || 0}
          icon={<Users className="w-4 h-4" />}
          trend={+5}
        />
        <StatsCard
          title="Total Tips"
          value={analytics?.totalTips || 0}
          icon={<DollarSign className="w-4 h-4" />}
          prefix="$"
          trend={+15}
        />
        <StatsCard
          title="Avg. Response Time"
          value={analytics?.averageResponseTime || 0}
          icon={<Clock className="w-4 h-4" />}
          suffix="min"
          trend={-2}
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            <BarChart className="w-4 h-4 mr-2" />
            Request Trends
          </TabsTrigger>
          <TabsTrigger value="genres">
            <PieChart className="w-4 h-4 mr-2" />
            Popular Genres
          </TabsTrigger>
          <TabsTrigger value="activity">
            <LineChart className="w-4 h-4 mr-2" />
            Activity Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <Card className="p-6">
            <RequestTrendsChart data={analytics?.requestsByHour} />
          </Card>
        </TabsContent>

        <TabsContent value="genres" className="mt-6">
          <Card className="p-6">
            <GenreDistributionChart data={analytics?.popularGenres} />
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card className="p-6">
            <ActivityTimelineChart eventId={eventId} dateRange={dateRange} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
  trend?: number;
}

function StatsCard({ title, value, icon, prefix, suffix, trend }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">
            {prefix}{value.toLocaleString()}{suffix}
          </h3>
        </div>
        <div className={`p-2 rounded-full bg-[#F49620]/10 text-[#F49620]`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`mt-4 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
        </div>
      )}
    </Card>
  );
} 