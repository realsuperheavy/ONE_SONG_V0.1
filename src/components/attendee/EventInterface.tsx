import { useState } from 'react';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import { useRequests } from '@/hooks/useRequests';
import { SearchBar } from '@/components/search/SearchBar';
import { TrackList } from '@/components/tracks/TrackList';
import { RequestList } from '@/components/requests/RequestList';
import { PaymentModal } from '@/components/payments/PaymentModal';

interface EventInterfaceProps {
  eventId: string;
}

export const EventInterface: React.FC<EventInterfaceProps> = ({ eventId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const { results, isSearching } = useSpotifySearch(searchQuery);
  const { requests, makeRequest } = useRequests(eventId);

  const handleRequest = async (track: SpotifyTrack) => {
    setSelectedTrack(track);
    // Show payment modal if tips are enabled
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="sticky top-[60px] bg-background/95 backdrop-blur-sm p-4 z-10">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
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

      <PaymentModal
        track={selectedTrack}
        onClose={() => setSelectedTrack(null)}
        onSuccess={makeRequest}
      />
    </div>
  );
}; 