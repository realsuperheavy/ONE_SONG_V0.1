import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

// Inside the DJDashboard component
{activeView === 'analytics' && (
  <AnalyticsDashboard eventId={eventId} />
)} 