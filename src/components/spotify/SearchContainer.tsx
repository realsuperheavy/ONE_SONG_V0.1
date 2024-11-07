import { useState, useCallback } from 'react';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { SpotifyTrack } from '@/lib/spotify/services/track';

interface SearchContainerProps {
  onSelect: (track: SpotifyTrack) => void;
  className?: string;
}

export function SearchContainer({ onSelect, className = '' }: SearchContainerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, loading, error, search } = useSpotifySearch();

  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query);
    search(query);
  }, [search]);

  return (
    <div className={className}>
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search for songs..."
        className="mb-4"
      />
      {searchTerm && (
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          onSelect={onSelect}
        />
      )}
    </div>
  );
} 