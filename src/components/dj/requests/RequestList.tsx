import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SongRequest } from '@/types/models';
import { Search, Filter, Music2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useRequestStore } from '@/store/request';

interface RequestListProps {
  eventId: string;
}

export function RequestList({ eventId }: RequestListProps) {
  const { requests, updateRequest } = useRequestStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const handleApprove = async (requestId: string) => {
    await updateRequest(requestId, eventId, { status: 'approved' });
  };

  const handleReject = async (requestId: string) => {
    await updateRequest(requestId, eventId, { status: 'rejected' });
  };

  const filteredRequests = requests.filter((request: SongRequest) => {
    const matchesSearch = 
      request.song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || request.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={(value: typeof filter) => setFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredRequests.map((request: SongRequest) => (
          <RequestCard
            key={request.id}
            request={request}
            onApprove={() => handleApprove(request.id)}
            onReject={() => handleReject(request.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface RequestCardProps {
  request: SongRequest;
  onApprove: () => void;
  onReject: () => void;
}

function RequestCard({ request, onApprove, onReject }: RequestCardProps) {
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    approved: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
    played: 'bg-blue-500/10 text-blue-500'
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* Song Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-[#F49620]" />
            <h3 className="font-medium text-white">{request.song.title}</h3>
          </div>
          <p className="text-sm text-gray-400">{request.song.artist}</p>
        </div>

        {/* Request Details */}
        <div className="flex items-center gap-4">
          {request.metadata.tipAmount && (
            <Badge variant="secondary" className="bg-[#F49620]/10 text-[#F49620]">
              ${request.metadata.tipAmount}
            </Badge>
          )}
          <Badge className={statusColors[request.status]}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                onClick={onApprove}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                onClick={onReject}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 