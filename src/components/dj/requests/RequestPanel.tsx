export const RequestPanel: React.FC<RequestPanelProps> = ({
  requests,
  eventId
}) => {
  const [filter, setFilter] = useState<RequestFilter>('all');
  const [search, setSearch] = useState('');
  
  const filteredRequests = useMemo(() => {
    return requests
      .filter(request => {
        if (filter === 'all') return true;
        return request.status === filter;
      })
      .filter(request => 
        request.song.title.toLowerCase().includes(search.toLowerCase()) ||
        request.song.artist.toLowerCase().includes(search.toLowerCase())
      );
  }, [requests, filter, search]);

  return (
    <Card className="bg-gray-800 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Requests</h2>
          <Badge variant="primary">
            {filteredRequests.length} Pending
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select
            value={filter}
            onChange={(value) => setFilter(value as RequestFilter)}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' }
            ]}
          />
        </div>

        {/* Request List */}
        <div className="space-y-2 mt-4 max-h-[600px] overflow-y-auto">
          {filteredRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              eventId={eventId}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}; 