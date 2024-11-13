import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Music2, User } from 'lucide-react';
import type { SongRequest } from '@/types/models';

interface RequestDetailsProps {
  request: SongRequest;
  showUserInfo?: boolean;
}

export function RequestDetails({ request, showUserInfo = false }: RequestDetailsProps) {
  const statusColors = {
    pending: 'bg-yellow-500 text-yellow-50',
    approved: 'bg-green-500 text-green-50',
    rejected: 'bg-red-500 text-red-50'
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{request.song.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{request.song.artist}</p>
        </div>
        <Badge className={statusColors[request.status]}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>

      {request.metadata.message && (
        <div className="bg-muted/50 p-3 rounded-md">
          <p className="text-sm italic">"{request.metadata.message}"</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{new Date(request.metadata.requestTime).toLocaleTimeString()}</span>
        </div>
        {showUserInfo && (
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Requested by {request.userId}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>{request.metadata.votes} votes</span>
        </div>
      </div>

      {request.song.duration && (
        <div className="text-sm text-muted-foreground">
          Duration: {Math.floor(request.song.duration / 60000)}:{String(Math.floor((request.song.duration % 60000) / 1000)).padStart(2, '0')}
        </div>
      )}
    </Card>
  );
} 