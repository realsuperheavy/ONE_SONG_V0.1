import { useMyRequests } from "@/hooks/useMyRequests";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, ThumbsUp } from "lucide-react";
import { MyRequestsSkeleton } from "./MyRequestsSkeleton";
import type { SongRequest } from "@/types";

interface MyRequestsProps {
  eventId: string;
  userId: string;
}

export function MyRequests({ eventId, userId }: MyRequestsProps) {
  const { requests, isLoading, error } = useMyRequests(eventId, userId);

  if (isLoading) {
    return <MyRequestsSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-destructive">Failed to load requests: {error.message}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">My Requests</h2>
      {requests.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          You haven&apos;t made any requests yet
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </Card>
  );
}

interface RequestCardProps {
  request: SongRequest;
}

function RequestCard({ request }: RequestCardProps) {
  const statusColors = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    played: "bg-blue-500"
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-accent/50">
      <Music className="text-muted-foreground" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">{request.song.title}</p>
          <Badge variant="secondary" className={statusColors[request.status]}>
            {request.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{new Date(request.metadata.requestTime).toLocaleTimeString()}</span>
          </div>
          {request.metadata.votes > 0 && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span>{request.metadata.votes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 