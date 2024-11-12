import { useEffect } from 'react';
import { useAnalyticsStore } from '@/store/analytics';
import { RequestAnalytics } from './RequestAnalytics';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface AnalyticsDashboardProps {
  eventId: string;
  className?: string;
}

export function AnalyticsDashboard({ eventId, className = '' }: AnalyticsDashboardProps) {
  const { analytics, loading, error, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics(eventId);
  }, [eventId, fetchAnalytics]);

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
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900">Event Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <RequestAnalytics eventId={eventId} />
    </div>
  );
} 