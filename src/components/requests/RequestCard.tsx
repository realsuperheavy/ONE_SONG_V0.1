import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { EventRequestService } from '@/lib/firebase/services/event-request';
import { useToast } from '@/hooks/useToast';
import { STATUS_COLORS } from '@/constants/status';
import type { SongRequest } from '@/types/models';

interface RequestCardProps {
  request: SongRequest;
  showVoting?: boolean;
}

export function RequestCard({ request, showVoting = true }: RequestCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { showToast } = useToast();
  const requestService = new EventRequestService();

  const handleVote = async () => {
    if (!user) return;
    
    setIsVoting(true);
    try {
      await requestService.voteForRequest(request.eventId, request.id, user.id);
      showToast({
        title: "Success",
        description: "Vote submitted successfully",
        variant: "default"
      });
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <h3 className="font-medium">{request.song.title}</h3>
          <p className="text-sm text-muted-foreground">{request.song.artist}</p>
        </div>
        <Badge className={STATUS_COLORS[request.status].bg}>
          {request.status}
        </Badge>
      </CardHeader>
      
      {request.metadata.message && (
        <CardContent>
          <p className="text-sm italic text-muted-foreground">
            "{request.metadata.message}"
          </p>
        </CardContent>
      )}

      <CardFooter className="flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-1 h-4 w-4" />
          {new Date(request.metadata.requestTime).toLocaleTimeString()}
        </div>
        {showVoting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVote}
            disabled={isVoting || request.userId === user?.id}
            className="flex items-center gap-1"
          >
            <ThumbsUp className={`h-4 w-4 ${isVoting ? 'animate-pulse' : ''}`} />
            <span>{request.metadata.votes}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 