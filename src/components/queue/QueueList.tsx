import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { QueueItem } from '@/lib/firebase/services/queue';
import { XIcon, GripVerticalIcon } from 'lucide-react';

interface QueueListProps {
  queue: QueueItem[];
  onReorder: (eventId: string, newOrder: string[]) => Promise<void>;
  onRemove: (eventId: string, itemId: string) => Promise<void>;
}

export function QueueList({ queue, onReorder, onRemove }: QueueListProps) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(queue[0].eventId, items.map(item => item.id));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="queue">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {queue.map((item, index) => (
              <Draggable
                key={item.id}
                draggableId={item.id}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex items-center space-x-2 bg-gray-50 p-2 rounded"
                  >
                    <div {...provided.dragHandleProps}>
                      <GripVerticalIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.song.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {item.song.artist}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(item.eventId, item.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
} 