'use client';

import { useEffect, useState } from 'react';
import { EventRequestService } from '@/lib/firebase/services/event-request';
import type { SongRequest } from '@/types/models';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';

interface Props {
  eventId: string;
  onQueueUpdate?: (queue: SongRequest[]) => void;
}

export function QueueManager({ eventId, onQueueUpdate }: Props) {
  const [queue, setQueue] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const requestService = new EventRequestService();

  useEffect(() => {
    const unsubscribe = requestService.subscribeToQueue(eventId, (updatedQueue) => {
      setQueue(updatedQueue);
      setLoading(false);
      onQueueUpdate?.(updatedQueue);
    });

    return () => unsubscribe();
  }, [eventId, onQueueUpdate]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    await requestService.updateQueueOrder(eventId, items.map(item => item.id));
  };

  if (loading) return <div>Loading queue...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Queue</h3>
        <span className="text-sm text-gray-500">{queue.length} songs</span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="queue">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {queue.map((song, index) => (
                <Draggable key={song.id} draggableId={song.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-4 bg-white rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{song.song.title}</h4>
                          <p className="text-sm text-gray-600">
                            {song.song.artist}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => requestService.removeFromQueue(eventId, song.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 