import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Grip, X } from 'lucide-react';
import type { QueueItem as QueueItemType } from '@/types/models';

interface QueueItemProps {
  item: QueueItemType;
  eventId: string;
  isDragging: boolean;
  onRemove: (itemId: string) => void;
}

export function QueueItem({ item, eventId, isDragging, onRemove }: QueueItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } catch (error) {
      console.error('Failed to remove item from queue:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className={`p-4 ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-4">
        <Grip className="cursor-move text-gray-400" />
        <div className="flex-1">
          <h3 className="font-medium">{item.song.title}</h3>
          <p className="text-sm text-gray-500">{item.song.artist}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isRemoving}
        >
          {isRemoving ? <Music className="animate-spin" /> : <X />}
        </Button>
      </div>
    </Card>
  );
} 