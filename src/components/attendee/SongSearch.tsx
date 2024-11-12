import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSpotifySearch } from "@/hooks/useSpotifySearch";
import { useRequestSong } from "@/hooks/useRequestSong";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Search, Music } from "lucide-react";
import type { SpotifyTrack } from "@/types/models";

interface SongSearchProps {
  eventId: string;
  userId: string;
}

export function SongSearch({ eventId, userId }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  
  const { 
    results, 
    loading,
    error,
    search 
  } = useSpotifySearch({
    limit: 20,
    debounceMs: 300
  });
  
  const { 
    requestSong, 
    isRequesting 
  } = useRequestSong(eventId, userId);

  const convertToSpotifyTrack = (result: typeof results[0]): SpotifyTrack => ({
    id: result.id,
    name: result.title,
    artists: [{ id: '0', name: result.artist }],
    album: {
      id: '0',
      name: '',
      images: result.albumArt ? [{ url: result.albumArt, height: 300, width: 300 }] : []
    },
    duration_ms: result.duration,
    uri: `spotify:track:${result.id}`
  });

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for a song..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading && (
          <div className="py-4">
            <Progress value={undefined} />
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <div className="space-y-2">
          {results.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <Music className="text-muted-foreground" />
                <div>
                  <p className="font-medium">{track.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {track.artist}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => requestSong(convertToSpotifyTrack(track))}
                disabled={isRequesting}
              >
                Request
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 