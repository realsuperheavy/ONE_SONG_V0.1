'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueueStore } from '@/store/queue';
import { useEventStore } from '@/store/event';
import { QueueItem } from '@/components/queue/QueueItem';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SongRequestModal } from '@/components/song-request/SongRequestModal';
import { PlaylistManager } from '@/components/dj/PlaylistManager';
import { useToast } from '@/hooks/useToast';
import { useQueueManager } from '@/hooks/useQueueManager';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';

export default function QueuePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { queue, loading, error } = useQueueStore();
  const { currentEvent } = useEventStore();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { showToast } = useToast();
  const { addToQueue } = useQueueManager(eventId);

  useEffect(() => {
    analyticsService.trackEvent('page_view', {
      page: 'queue',
      eventId,
      eventName: currentEvent?.name
    });

    return () => {
      analyticsService.trackEvent('page_exit', {
        page: 'queue',
        eventId,
        duration: Date.now() - performance.now()
      });
    };
  }, [eventId, currentEvent?.name]);

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
      
      analyticsService.trackEvent('song_request_submitted', {
        eventId,
        songTitle: requestData.song?.title,
        success: true
      });
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive"
      });
      analyticsService.trackError(error as Error, {
        context: 'song_request_submission',
        eventId,
        songTitle: requestData.song?.title
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {currentEvent?.name} Queue
          </h1>
          <p className="text-sm text-gray-500">
            {queue.length} songs in queue
          </p>
        </div>
        <Button 
          onClick={() => {
            setShowRequestModal(true);
            analyticsService.trackEvent('request_modal_opened', {
              eventId,
              queueLength: queue.length
            });
          }}
        >
          Request Song
        </Button>
      </div>

      {currentEvent && (
        <div className="mb-8">
          <PlaylistManager eventId={eventId} isAttendee={true} />
        </div>
      )}

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
        {queue.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No songs in queue. Be the first to request!
          </p>
        )}
      </div>

      <SongRequestModal
        open={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          analyticsService.trackEvent('request_modal_closed', {
            eventId
          });
        }}
        onSubmit={handleSongRequest}
        eventId={eventId}
      />
    </div>
  );
} 