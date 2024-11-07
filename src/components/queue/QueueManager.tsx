import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQueueStore } from '@/store/queue';
import { queueService } from '@/lib/firebase/services/queue';
import { QueueItem } from './QueueItem';

interface QueueManagerProps {
  eventId: string;
}

export function QueueManager({ eventId }: QueueManagerProps) {
  const { queue, setQueue, loading, error } = useQueueStore();
  const [isDragging, setIsDragging] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = queueService.subscribeToQueue(eventId, (updatedQueue) => {
      setQueue(updatedQueue);
    });

    return () => unsubscribe();
  }, [eventId, setQueue]);

  const handleDragEnd = async (result: any) => {
    setIsDragging(false);

    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update UI
    setQueue(items);

    // Update in database
    try {
      await queueService.reorderQueue(
        eventId, 
        items.map(item => item.id)
      );
    } catch (error) {
      // Revert on error
      setQueue(queue);
    }
  };

  const handlePlay = (itemId: string) => {
    setCurrentlyPlaying(itemId);
    // Add your audio playback logic here
  };

  const handlePause = () => {
    setCurrentlyPlaying(null);
    // Add your audio pause logic here
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <DragDropContext
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <Droppable droppableId="queue">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No songs in queue
              </div>
            ) : (
              queue.map((item, index) => (
                <Draggable 
                  key={item.id} 
                  draggableId={item.id} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`bg-white rounded-lg shadow ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      <QueueItem 
                        item={item} 
                        eventId={eventId}
                        isDragging={isDragging}
                        isPlaying={currentlyPlaying === item.id}
                        onPlay={() => handlePlay(item.id)}
                        onPause={handlePause}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
} 