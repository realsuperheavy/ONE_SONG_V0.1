'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { LineChart } from '@/components/ui/charts/LineChart';
import { BarChart } from '@/components/ui/charts/BarChart';

interface AnalyticsDisplayProps {
  eventId: string;
}

export function ResponsiveAnalyticsDisplay({ eventId }: AnalyticsDisplayProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const [layout, setLayout] = useState<'compact' | 'full'>('full');

  useEffect(() => {
    setLayout(isMobile ? 'compact' : 'full');
  }, [isMobile]);

  return (
    <div className="space-y-4">
      {/* Responsive Grid Layout */}
      <div className={`grid gap-4 ${
        isTablet ? 'grid-cols-2' : 
        isMobile ? 'grid-cols-1' : 
        'grid-cols-3'
      }`}>
        {/* Real-time Metrics */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Current Activity</h3>
          <div className="space-y-4">
            {layout === 'compact' ? (
              // Mobile-optimized view
              <CompactMetrics eventId={eventId} />
            ) : (
              // Full metrics display
              <FullMetrics eventId={eventId} />
            )}
          </div>
        </Card>

        {/* Trend Analysis */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Trends</h3>
          <LineChart
            data={[]} // Add your data here
            height={isMobile ? 200 : 300}
            responsive={true}
          />
        </Card>

        {/* Popular Categories */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
          <BarChart
            data={[]} // Add your data here
            height={isMobile ? 200 : 300}
            responsive={true}
          />
        </Card>
      </div>
    </div>
  );
}

// Compact view for mobile
function CompactMetrics({ eventId }: { eventId: string }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Simplified metrics for mobile */}
    </div>
  );
}

// Full metrics display
function FullMetrics({ eventId }: { eventId: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Detailed metrics */}
    </div>
  );
} 