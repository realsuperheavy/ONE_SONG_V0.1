import { useState } from 'react';
import { useRequestStore } from '@/store/request';
import { useAuthStore } from '@/store/auth';
import { SongRequest } from '@/types/models';
import { PlayIcon, PauseIcon, ThumbsUpIcon } from 'lucide-react';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';

interface RequestCardProps {
  request: SongRequest;
  isOwner: boolean;
  isDJ: boolean;
  className?: string;
}

export function RequestCard({ 
  request, 
  isOwner, 
  isDJ, 
  className = '' 
}: RequestCardProps) {
  const [voting, setVoting] = useState(false);
  const { voteRequest, updateRequest } = useRequestStore();
  const user = useAuthStore((state) => state.user);
  const { 
    isPlaying, 
    currentTrack, 
    play, 
    pause 
  } = useSpotifyPlayback();

  const isCurrentTrack = currentTrack?.id === request.song.id;

  const handleVote = async () => {
    if (!user || voting) return;
    
    setVoting(true);
    try {
      await voteRequest(request.id, user.id);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVoting(false);
    }
  };

  const handleStatusUpdate = async (status: SongRequest['status']) => {
    try {
      await updateRequest(request.id, { status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePlayPause = () => {
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      play(request.song);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="relative flex-shrink-0">
          {request.song.albumArt ? (
            <img
              src={request.song.albumArt}
              alt={`${request.song.title} album art`}
              className="w-16 h-16 rounded"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Art</span>
            </div>
          )}
          {request.song.previewUrl && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded opacity-0 hover:opacity-100 transition-opacity duration-200"
            >
              {isCurrentTrack && isPlaying ? (
                <PauseIcon className="w-8 h-8 text-white" />
              ) : (
                <PlayIcon className="w-8 h-8 text-white" />
              )}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-medium text-gray-900 truncate">
            {request.song.title}
          </h4>
          <p className="text-sm text-gray-500">{request.song.artist}</p>
          {request.metadata.message && (
            <p className="text-sm text-gray-600 mt-1">{request.metadata.message}</p>
          )}
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVote}
              disabled={voting || isOwner}
              className={`flex items-center space-x-1 px-2 py-1 rounded ${
                voting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <ThumbsUpIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{request.metadata.votes}</span>
            </button>
            {request.metadata.tipAmount && (
              <span className="text-green-600 text-sm font-medium">
                ${request.metadata.tipAmount}
              </span>
            )}
          </div>

          {isDJ && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusUpdate('approved')}
                disabled={request.status === 'approved'}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={request.status === 'rejected'}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Reject
              </button>
            </div>
          )}

          <span className={`text-sm ${
            request.status === 'approved' ? 'text-green-600' :
            request.status === 'rejected' ? 'text-red-600' :
            request.status === 'played' ? 'text-gray-600' :
            'text-yellow-600'
          }`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
} 