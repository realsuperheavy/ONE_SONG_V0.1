import { useState } from 'react';
import { useRequestStore } from '@/store/request';
import { requestService } from '@/lib/firebase/services/request';
import { Card } from '@/components/ui/card';
import { RequestList } from './RequestList';
import { Spinner } from '@/components/ui/spinner';
import { SongRequest } from '@/types/models';

interface RequestManagerProps {
  eventId: string;
}

export function RequestManager({ eventId }: RequestManagerProps) {
  const { requests, loading, error } = useRequestStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const update: Partial<SongRequest> = {
        status: 'approved' as const
      };
      await requestService.updateRequest(requestId, update);
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const update: Partial<SongRequest> = {
        status: 'rejected' as const
      };
      await requestService.updateRequest(requestId, update);
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 text-center text-red-500">
        {error}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Song Requests</h2>
        <RequestList
          eventId={eventId}
          className=""
        />
      </Card>
    </div>
  );
} 