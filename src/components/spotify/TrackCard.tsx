import { useState } from 'react';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { SpotifyTrack } from '@/lib/spotify/services/track';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';

interface TrackCardProps {
  track: SpotifyTrack;
  onClick: () => void;
  showPreview?: boolean;
}

export function TrackCard({ track, onClick, showPreview = true }: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { 
    isPlaying, 
    currentTrack, 
    play, 
    pause 
  } = useSpotifyPlayback({
    onPlaybackError: (error) => {
      console.error('Playback error:', error);
    }
  });

  const isCurrentTrack = currentTrack?.id === track.id;
  const canPreview = showPreview && track.previewUrl;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      play(track);
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center p-4 rounded-lg ${
        isHovered ? 'bg-gray-50' : 'bg-white'
      } cursor-pointer transition-colors duration-200`}
    >
      <div className="relative flex-shrink-0">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={`${track.title} album art`}
            className="w-12 h-12 rounded"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Art</span>
          </div>
        )}
        {canPreview && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded opacity-0 hover:opacity-100 transition-opacity duration-200"
          >
            {isCurrentTrack && isPlaying ? (
              <PauseIcon className="w-6 h-6 text-white" />
            ) : (
              <PlayIcon className="w-6 h-6 text-white" />
            )}
          </button>
        )}
      </div>

      <div className="ml-4 flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {track.title}
        </h4>
        <p className="text-sm text-gray-500 truncate">{track.artist}</p>
      </div>

      {track.explicit && (
        <span className="ml-2 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
          Explicit
        </span>
      )}
    </div>
  );
} 