import { usePlayback } from '@/lib/playback/PlaybackContext';
import { useQueue } from '@/hooks/useQueue';
import { PlaybackControls } from '../playback/PlaybackControls';
import { QueueList } from '../queue/QueueList';
import { 
  SkipForwardIcon, 
  ShuffleIcon, 
  RepeatIcon,
  ListMusicIcon 
} from 'lucide-react';

export function DJControlPanel({ eventId }: { eventId: string }) {
  const { 
    currentTrack,
    isPlaying,
    play,
    pause,
    seek,
    setVolume 
  } = usePlayback();
  
  const { queue, reorderQueue, removeFromQueue } = useQueue(eventId);

  const handleSkipNext = async () => {
    if (queue.length > 0) {
      await play(queue[0].song);
      await removeFromQueue(eventId, queue[0].id);
    }
  };

  const handleShuffle = async () => {
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    await reorderQueue(eventId, shuffled.map(item => item.id));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-7xl mx-auto">
        {/* Main Controls */}
        <div className="p-4 border-b">
          <PlaybackControls />
        </div>

        {/* Extended Controls */}
        <div className="p-4 grid grid-cols-3 gap-4">
          {/* Queue Management */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Queue</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSkipNext}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Skip to next"
              >
                <SkipForwardIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleShuffle}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Shuffle queue"
              >
                <ShuffleIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {/* Toggle repeat */}}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Repeat mode"
              >
                <RepeatIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Track Info */}
          <div className="space-y-2">
            {currentTrack && (
              <>
                <h3 className="font-medium text-gray-900">Now Playing</h3>
                <div className="flex items-center space-x-3">
                  {currentTrack.albumArt && (
                    <img
                      src={currentTrack.albumArt}
                      alt={`${currentTrack.title} album art`}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">{currentTrack.title}</div>
                    <div className="text-sm text-gray-500">
                      {currentTrack.artist}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Queue List */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 flex items-center">
              <ListMusicIcon className="w-5 h-5 mr-2" />
              Up Next ({queue.length})
            </h3>
            <div className="max-h-32 overflow-y-auto">
              <QueueList
                queue={queue}
                onReorder={reorderQueue}
                onRemove={removeFromQueue}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 