import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { SongRequest } from '@/types/models';
import { Music2, GripVertical, Play, SkipForward, Clock } from 'lucide-react';

interface QueueListProps {
  queue: SongRequest[];
  onReorder: (newOrder: string[]) => void;
  onPlay: (request: SongRequest) => void;
  currentSongId?: string;
}

export function QueueList({ queue, onReorder, onPlay, currentSongId }: QueueListProps) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newOrder = Array.from(queue);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    onReorder(newOrder.map(item => item.id));
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
            {queue.map((request, index) => (
              <Draggable
                key={request.id}
                draggableId={request.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`p-4 ${
                      snapshot.isDragging ? 'bg-[#2E2F2E]' : ''
                    } ${request.id === currentSongId ? 'border-[#F49620]' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        {...provided.dragHandleProps}
                        className="text-gray-400 hover:text-white cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {request.song.title}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {request.song.artist}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-gray-400 text-sm">
                          <Clock size={14} className="mr-1" />
                          {formatDuration(request.song.duration)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPlay(request)}
                          className={request.id === currentSongId ? 'text-[#F49620]' : ''}
                        >
                          <Play size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {queue.length === 0 && (
        <div className="text-center py-12">
          <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No songs in queue</p>
        </div>
      )}
    </DragDropContext>
  );
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 