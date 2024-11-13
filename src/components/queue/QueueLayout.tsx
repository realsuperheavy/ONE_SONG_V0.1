'use client';

import { useState } from 'react';
import { CardGrid, CardItem } from '@/components/ui/card-grid';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useQueueStore } from '@/store/queue';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface QueueLayoutProps {
  eventId: string;
}

export function QueueLayout({ eventId }: QueueLayoutProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { queue, loading } = useQueueStore();

  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView);
    analyticsService.trackEvent('queue_view_changed', {
      eventId,
      view: newView
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Queue Management</h2>
          <p className="text-gray-500">
            {queue.length} songs in queue
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <StatusIndicator 
            status={loading ? 'loading' : 'online'} 
            label="Real-time updates" 
          />
          <div className="flex gap-2">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              onClick={() => handleViewChange('grid')}
              aria-label="Grid view"
            >
              Grid
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => handleViewChange('list')}
              aria-label="List view"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Queue Content */}
      {view === 'grid' ? (
        <CardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
          {queue.map((item) => (
            <CardItem
              key={item.id}
              title={item.song.title}
              subtitle={item.song.artist}
            >
              {/* Queue item content */}
            </CardItem>
          ))}
        </CardGrid>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <CardItem
              key={item.id}
              title={item.song.title}
              subtitle={item.song.artist}
              className="flex items-center justify-between"
            >
              {/* Queue item content */}
            </CardItem>
          ))}
        </div>
      )}
    </div>
  );
} 