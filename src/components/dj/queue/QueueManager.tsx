import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQueue } from '@/hooks/useQueue';
import { SongRequest } from '@/types/models';
import { Music2, GripVertical, Play, SkipForward } from 'lucide-react';

interface QueueManagerProps {
  eventId: string;
}

export function QueueManager({ eventId }: QueueManagerProps) {
  const { queue, reorderQueue, removeFromQueue, isLoading } = useQueue(eventId);
  const [currentSong, setCurrentSong] = useState<SongRequest | null>(null);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newOrder = Array.from(queue);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    reorderQueue(newOrder.map(item => item.id));
  };

  const handlePlay = (song: SongRequest) => {
    setCurrentSong(song);
    // Additional play logic here
  };

  const handleSkip = () => {
    if (!currentSong || queue.length === 0) return;
    const currentIndex = queue.findIndex(song => song.id === currentSong.id);
    const nextSong = queue[currentIndex + 1] || null;
    setCurrentSong(nextSong);
    if (currentSong) {
      removeFromQueue(currentSong.id);
    }
  };

  if (isLoading) {
    return <QueueSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Now Playing */}
      <Card className="p-6 bg-gradient-to-r from-[#1E1E1E] to-[#2E2F2E]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Now Playing</h3>
            {currentSong ? (
              <div className="mt-2">
                <p className="text-lg font-medium text-white">{currentSong.song.title}</p>
                <p className="text-sm text-gray-400">{currentSong.song.artist}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">No song playing</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => currentSong && handlePlay(currentSong)}
              disabled={!currentSong}
            >
              <Play className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSkip}
              disabled={!currentSong || queue.length === 0}
            >
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Queue</h2>
          <p className="text-sm text-gray-400">{queue.length} songs</p>
        </div>

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
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            {...provided.dragHandleProps}
                            className="text-gray-400 hover:text-white"
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePlay(request)}
                          >
                            <Play size={16} />
                          </Button>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {queue.length === 0 && (
          <div className="text-center py-12">
            <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No songs in queue</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Card className="p-6">
        <div className="h-20 bg-[#2E2F2E] rounded-lg" />
      </Card>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="h-12 bg-[#2E2F2E] rounded-lg" />
          </Card>
        ))}
      </div>
    </div>
  );
} 