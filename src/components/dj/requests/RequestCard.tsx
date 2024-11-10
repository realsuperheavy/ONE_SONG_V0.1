import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SongRequest } from '@/types/models';
import { Music2, ThumbsUp, ThumbsDown, DollarSign, Clock } from 'lucide-react';

interface RequestCardProps {
  request: SongRequest;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export function RequestCard({ request, onApprove, onReject, showActions = true }: RequestCardProps) {
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    approved: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
    played: 'bg-blue-500/10 text-blue-500'
  };

  return (
    <Card className="p-4 hover:bg-[#2E2F2E] transition-colors">
      <div className="flex items-center gap-4">
        {/* Song Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-[#F49620]" />
            <h3 className="font-medium text-white">{request.song.title}</h3>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-400">{request.song.artist}</p>
            <div className="flex items-center text-sm text-gray-400">
              <Clock size={14} className="mr-1" />
              {formatDuration(request.song.duration)}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="flex items-center gap-4">
          {request.metadata.tipAmount && (
            <Badge variant="secondary" className="bg-[#F49620]/10 text-[#F49620]">
              <DollarSign size={14} className="mr-1" />
              {request.metadata.tipAmount}
            </Badge>
          )}
          <Badge className={statusColors[request.status]}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
          {showActions && request.status === 'pending' && (
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

      {request.metadata.message && (
        <p className="mt-2 text-sm text-gray-400 italic">
          "{request.metadata.message}"
        </p>
      )}
    </Card>
  );
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 