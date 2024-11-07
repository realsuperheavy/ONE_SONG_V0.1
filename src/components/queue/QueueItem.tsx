import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { queueService, QueueItem as QueueItemType } from '@/lib/firebase/services/queue';
import { PlayIcon, PauseIcon, XIcon } from 'lucide-react';

interface QueueItemProps {
  item: QueueItemType;
  eventId: string;
  isDragging: boolean;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export function QueueItem({ 
  item, 
  eventId, 
  isDragging, 
  isPlaying,
  onPlay,
  onPause 
}: QueueItemProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  const handleRemove = async () => {
    if (isDragging || !user?.type === 'dj') return;
    
    setLoading(true);
    setError(null);

    try {
      await queueService.removeFromQueue(eventId, item.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-4 p-4 ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex-shrink-0">
        <span className="text-gray-500">#{item.queuePosition + 1}</span>
      </div>

      {item.song.albumArt && (
        <img
          src={item.song.albumArt}
          alt={`${item.song.title} album art`}
          className="w-12 h-12 rounded"
        />
      )}

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {item.song.title}
        </h4>
        <p className="text-sm text-gray-500 truncate">{item.song.artist}</p>
        {item.metadata.message && (
          <p className="mt-1 text-xs text-gray-600 truncate">
            "{item.metadata.message}"
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {item.metadata.tipAmount && (
          <span className="text-green-600 text-sm font-medium">
            ${item.metadata.tipAmount}
          </span>
        )}
        
        {user?.type === 'dj' && (
          <>
            {isPlaying ? (
              <button
                onClick={onPause}
                className="p-1 rounded-full hover:bg-gray-100"
                title="Pause"
              >
                <PauseIcon className="w-5 h-5 text-gray-600" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="p-1 rounded-full hover:bg-gray-100"
                title="Play"
              >
                <PlayIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <button
              onClick={handleRemove}
              disabled={loading || isDragging}
              className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
              title="Remove"
            >
              <XIcon className="w-5 h-5 text-red-600" />
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-xs absolute bottom-1 right-1">
          {error}
        </div>
      )}
    </div>
  );
} 