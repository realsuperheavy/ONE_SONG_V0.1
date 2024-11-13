'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueueStore } from '@/store/queue';
import { useEventStore } from '@/store/event';
import { QueueItem } from '@/components/queue/QueueItem';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SongRequestModal } from '@/components/song-request/SongRequestModal';
import { useToast } from '@/hooks/useToast';
import { useQueueManager } from '@/hooks/useQueueManager';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';

export default function QueueViewPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { queue, loading, error } = useQueueStore();
  const { currentEvent } = useEventStore();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { showToast } = useToast();
  const { addToQueue } = useQueueManager(eventId);

  useEffect(() => {
    analyticsService.trackEvent('page_view', {
      page: 'queue_view',
      eventId
    });
  }, [eventId]);

  const handleSongRequest = async (requestData: Partial<SongRequest>) => {
    try {
      await addToQueue({
        ...requestData,
        eventId,
        status: 'pending'
      } as Omit<SongRequest, 'id'>);
      
      showToast({
        title: "Success",
        description: "Song request submitted successfully",
        variant: "default"
      });
      setShowRequestModal(false);
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive"
      });
      analyticsService.trackError(error as Error, {
        context: 'song_request',
        eventId
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          {currentEvent?.name} Queue
        </h1>
        <Button onClick={() => setShowRequestModal(true)}>
          Request Song
        </Button>
      </div>

      <div className="space-y-4">
        {queue.map((item) => (
          <QueueItem
            key={item.id}
            item={item}
            eventId={eventId}
            isDragging={false}
            onRemove={() => {}}
          />
        ))}
      </div>

      <SongRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleSongRequest}
        eventId={eventId}
      />
    </div>
  );
} 