import { useState } from 'react';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import { useRequests } from '@/hooks/useRequests';
import { SearchBar } from '@/components/search/SearchBar';
import { TrackList } from '@/components/tracks/TrackList';
import { RequestList } from '@/components/requests/RequestList';
import { PaymentModal } from '@/components/payments/PaymentModal';
import type { Track, SongRequest } from '@/types/components';

interface EventInterfaceProps {
  eventId: string;
}

export const EventInterface: React.FC<EventInterfaceProps> = ({ eventId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { results, isSearching } = useSpotifySearch(searchQuery);
  const { requests, makeRequest } = useRequests(eventId);

  const handleRequest = async (track: Track) => {
    setSelectedTrack(track);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="sticky top-[60px] bg-background/95 backdrop-blur-sm p-4 z-10">
        <SearchBar
          value={searchQuery}
          onChange={(value: string) => setSearchQuery(value)}
          isLoading={isSearching}
        />
      </div>

      <div className="space-y-8">
        {searchQuery ? (
          <TrackList
            tracks={results}
            onTrackSelect={handleRequest}
            isLoading={isSearching}
          />
        ) : (
          <RequestList
            requests={requests}
            showStatus
          />
        )}
      </div>

      {selectedTrack && (
        <PaymentModal
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
          onSuccess={(amount: number) => {
            makeRequest(selectedTrack, amount);
            setSelectedTrack(null);
          }}
        />
      )}
    </div>
  );
}; 