import { useState } from 'react';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import { useSpotifyRequest } from '@/hooks/useSpotifyRequest';
import { SearchContainer } from '@/components/spotify/SearchContainer';
import { SpotifyTrack } from '@/lib/spotify/services/track';
import { TrackCard } from '@/components/spotify/TrackCard';

interface RequestFormWithSearchProps {
  eventId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function RequestFormWithSearch({ 
  eventId, 
  onSuccess, 
  onError 
}: RequestFormWithSearchProps) {
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [message, setMessage] = useState('');
  const { requesting, makeRequest } = useSpotifyRequest({
    eventId,
    onRequestSuccess: () => {
      setSelectedTrack(null);
      setMessage('');
      onSuccess?.();
    },
    onRequestError
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack) return;

    try {
      await makeRequest(selectedTrack, message);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <div className="space-y-6">
      {!selectedTrack ? (
        <SearchContainer
          onSelect={setSelectedTrack}
          className="mb-6"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Selected Song</h3>
            <button
              onClick={() => setSelectedTrack(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Change Selection
            </button>
          </div>
          
          <TrackCard
            track={selectedTrack}
            onClick={() => {}}
            showPreview={true}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="message" 
                className="block text-sm font-medium text-gray-700"
              >
                Message (optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows={3}
                placeholder="Add a message to your request..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={requesting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {requesting ? 'Sending Request...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 