import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/store/analytics';
import { BarChart, LineChart, PieChart } from '@/components/charts';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

interface RequestAnalyticsProps {
  eventId: string;
  className?: string;
}

export function RequestAnalytics({ eventId, className = '' }: RequestAnalyticsProps) {
  const { analytics, loading, error, timeRange, setTimeRange, fetchAnalytics } = useAnalyticsStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'genres'>('overview');

  useEffect(() => {
    fetchAnalytics(eventId);
  }, [eventId, timeRange, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={className}>
      {/* Time Range Selector */}
      <div className="mb-6">
        <DateRangePicker
          value={timeRange}
          onChange={setTimeRange}
          maxDate={new Date()}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Requests</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {analytics.totalRequests}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Tips</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              ${analytics.totalTips.toFixed(2)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Approval Rate</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {(analytics.approvalRate * 100).toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'trends', 'genres'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-4">
              <h4 className="text-lg font-medium mb-4">Requests by Hour</h4>
              <BarChart
                data={Object.entries(analytics.requestsByHour).map(([hour, count]) => ({
                  label: `${hour}:00`,
                  value: count
                }))}
              />
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <h4 className="text-lg font-medium mb-4">Response Times</h4>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {(analytics.averageResponseTime / 1000).toFixed(1)}s
                </p>
                <p className="text-sm text-gray-500">Average Response Time</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'trends' && (
        <Card>
          <div className="p-4">
            <h4 className="text-lg font-medium mb-4">Request Trends</h4>
            <LineChart
              data={Object.entries(analytics.requestsByHour).map(([hour, count]) => ({
                label: `${hour}:00`,
                value: count
              }))}
            />
          </div>
        </Card>
      )}

      {activeTab === 'genres' && (
        <Card>
          <div className="p-4">
            <h4 className="text-lg font-medium mb-4">Popular Genres</h4>
            <PieChart
              data={Object.entries(analytics.popularGenres).map(([genre, count]) => ({
                label: genre,
                value: count
              }))}
            />
          </div>
        </Card>
      )}
    </div>
  );
}