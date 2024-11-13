'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { SpotifyTrack, SongRequest } from '@/types/models';
import { PlaybackControls } from '@/components/spotify/PlaybackControls';

interface SongRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (requestData: Partial<SongRequest>) => Promise<void>;
  eventId: string;
}

export function SongRequestModal({ open, onClose, onSubmit, eventId }: SongRequestModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [message, setMessage] = useState('');
  const { results, loading, error, search } = useSpotifySearch();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    search(query);
  };

  const handleSubmit = async () => {
    if (!selectedTrack) return;

    await onSubmit({
      song: {
        title: selectedTrack.name,
        artist: selectedTrack.artists.map(a => a.name).join(', '),
        albumArt: selectedTrack.album.images[0]?.url,
        duration: selectedTrack.duration_ms
      },
      metadata: {
        message,
        requestTime: Date.now(),
        votes: 0
      }
    });

    setSelectedTrack(null);
    setMessage('');
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-4">
          {!selectedTrack ? (
            <>
              <h2 className="text-lg font-semibold">Search for a Song</h2>
              <Input
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {loading && <LoadingSpinner />}
              {error && <p className="text-red-500 text-sm">{error.message}</p>}
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {results.map((track) => (
                  <div
                    key={track.id}
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setSelectedTrack(track)}
                  >
                    <p className="font-medium">{track.name}</p>
                    <p className="text-sm text-gray-500">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">Request Details</h2>
              <div className="flex items-center gap-4">
                {selectedTrack.album.images[0] && (
                  <img
                    src={selectedTrack.album.images[0].url}
                    alt="Album art"
                    className="w-16 h-16 rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{selectedTrack.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedTrack.artists.map(a => a.name).join(', ')}
                  </p>
                  <PlaybackControls 
                    previewUrl={selectedTrack.preview_url}
                    songTitle={selectedTrack.name}
                  />
                </div>
              </div>
              <Input
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTrack(null)}>
                  Back
                </Button>
                <Button onClick={handleSubmit}>
                  Submit Request
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 