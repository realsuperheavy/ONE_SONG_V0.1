'use client';

import { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useQueueStore } from '@/store/queue';
import { useEventStore } from '@/store/event';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface QueueManagementLayoutProps {
  eventId: string;
}

export function QueueManagementLayout({ eventId }: QueueManagementLayoutProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { queue, reorderQueue } = useQueueStore();
  const { currentEvent } = useEventStore();

  const handleDragEnd = (result: any) => {
    setIsDragging(false);
    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderQueue(items);
    analyticsService.trackEvent('queue_reordered', {
      eventId,
      itemId: reorderedItem.id,
      oldPosition: result.source.index,
      newPosition: result.destination.index
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Queue Management</h2>
        <StatusIndicator 
          status={currentEvent?.status || 'offline'}
          label={`${queue.length} songs in queue`}
        />
      </div>

      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="queue">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {queue.map((item, index) => (
                <Card
                  key={item.id}
                  className={`p-4 ${isDragging ? 'opacity-50' : ''}`}
                >
                  {/* Queue item content */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{item.song.title}</h3>
                      <p className="text-sm text-gray-500">{item.song.artist}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        #{index + 1}
                      </span>
                      {/* Add more controls as needed */}
                    </div>
                  </div>
                </Card>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 