import { SpotifyTrack } from '@/lib/spotify/services/track';
import { TrackCard } from './TrackCard';

interface SearchResultsProps {
  results: SpotifyTrack[];
  loading: boolean;
  error: string | null;
  onSelect: (track: SpotifyTrack) => void;
}

export function SearchResults({ 
  results, 
  loading, 
  error, 
  onSelect 
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No songs found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onClick={() => onSelect(track)}
        />
      ))}
    </div>
  );
} 