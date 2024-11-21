export const QueueSection: React.FC<{ queue: QueueItem[] }> = ({ queue }) => {
  const { voteForSong, userVotes } = useQueueVoting();

  return (
    <Card className="bg-gray-800 p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Queue</h2>
          <Badge variant="secondary">
            {queue.length} songs
          </Badge>
        </div>

        {/* Queue List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {queue.map((item, index) => (
            <QueueItem
              key={item.id}
              item={item}
              position={index + 1}
              userVote={userVotes[item.id]}
              onVote={(direction) => voteForSong(item.id, direction)}
            />
          ))}

          {queue.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Music2 className="w-12 h-12 mx-auto mb-2" />
              <p>Queue is empty</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const QueueItem: React.FC<{
  item: QueueItem;
  position: number;
  userVote?: 'up' | 'down';
  onVote: (direction: 'up' | 'down') => void;
}> = ({ item, position, userVote, onVote }) => (
  <div className="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg">
    <span className="text-gray-400 w-6 text-center">{position}</span>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-white truncate">{item.song.title}</p>
      <p className="text-sm text-gray-400 truncate">{item.song.artist}</p>
    </div>
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant={userVote === 'up' ? 'primary' : 'ghost'}
        onClick={() => onVote('up')}
      >
        <ChevronUp className="w-4 h-4" />
      </Button>
      <span className="text-white min-w-[2ch] text-center">
        {item.votes}
      </span>
      <Button
        size="sm"
        variant={userVote === 'down' ? 'primary' : 'ghost'}
        onClick={() => onVote('down')}
      >
        <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  </div>
); 