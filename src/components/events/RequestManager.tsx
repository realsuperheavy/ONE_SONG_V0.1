import { useEffect, useState } from 'react';
import { EventRequestService } from '@/lib/firebase/services/event-request';
import type { SongRequest } from '@/types/models';
import { Button } from '@/components/ui/button';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface Props {
  eventId: string;
  onRequestUpdate?: (request: SongRequest) => void;
}

type RequestAction = 'approve' | 'reject';

export function RequestManager({ eventId, onRequestUpdate }: Props) {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestService = new EventRequestService();

  useEffect(() => {
    const controller = new AbortController();
    
    async function loadRequests() {
      try {
        const data = await requestService.getEventRequests(eventId, {
          orderBy: 'votes',
          limit: 50
        });
        if (!controller.signal.aborted) {
          setRequests(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError('Failed to load requests');
          analyticsService.trackError(err as Error, {
            context: 'request_manager_load'
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRequests();
    
    return () => controller.abort();
  }, [eventId]);

  async function handleRequestAction(requestId: string, action: RequestAction) {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      await requestService.updateRequestStatus(eventId, requestId, action);
      await loadRequests(); // Refresh the list
      onRequestUpdate?.(request);
      
      analyticsService.trackEvent(`request_${action}d`, {
        eventId,
        requestId
      });
    } catch (err) {
      setError(`Failed to ${action} request`);
      analyticsService.trackError(err as Error, {
        context: 'request_manager_action',
        action
      });
    }
  }

  if (loading) return <div>Loading requests...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Song Requests</h3>
        <span className="text-sm text-gray-500">
          {requests.length} requests
        </span>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div 
            key={request.id}
            className="p-4 bg-white rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{request.song.title}</h4>
                <p className="text-sm text-gray-600">{request.song.artist}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {request.metadata.votes} votes
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestAction(request.id, 'reject')}
              >
                Reject
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleRequestAction(request.id, 'approve')}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 