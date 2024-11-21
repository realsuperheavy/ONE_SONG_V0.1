export const SongRequestSection: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, isLoading } = useSpotifySearch(searchQuery);
  const { submitRequest, isSubmitting } = useRequestSubmission(eventId);

  return (
    <Card className="bg-gray-800 p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Request a Song</h2>

        {/* Search Input */}
        <div className="relative">
          <Input
            placeholder="Search for a song..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700"
          />
          {isLoading && (
            <Spinner className="absolute right-3 top-1/2 transform -translate-y-1/2" />
          )}
        </div>

        {/* Search Results */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {results.map((song) => (
            <SongResultCard
              key={song.id}
              song={song}
              onRequest={() => submitRequest(song)}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

const SongResultCard: React.FC<{
  song: SpotifyTrack;
  onRequest: () => void;
  isSubmitting: boolean;
}> = ({ song, onRequest, isSubmitting }) => (
  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
    <div className="flex items-center space-x-3">
      <Image
        src={song.albumArt}
        alt={song.album}
        width={48}
        height={48}
        className="rounded"
      />
      <div>
        <p className="font-medium text-white">{song.title}</p>
        <p className="text-sm text-gray-400">{song.artist}</p>
      </div>
    </div>
    <Button
      onClick={onRequest}
      disabled={isSubmitting}
      variant="secondary"
      size="sm"
    >
      Request
    </Button>
  </div>
); 