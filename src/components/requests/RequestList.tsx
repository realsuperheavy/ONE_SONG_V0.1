import { useEffect } from 'react';
import { useRequestStore } from '@/store/request';
import { useAuthStore } from '@/store/auth';
import { requestService } from '@/lib/firebase/services/request';
import { RequestCard } from './RequestCard';
import { Spinner } from '@/components/ui/Spinner';

interface RequestListProps {
  eventId: string;
  className?: string;
}

export function RequestList({ eventId, className = '' }: RequestListProps) {
  const { requests, loading, error, setRequests } = useRequestStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const unsubscribe = requestService.subscribeToRequests(eventId, (updatedRequests) => {
      setRequests(updatedRequests);
    });

    return () => unsubscribe();
  }, [eventId, setRequests]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No requests yet
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          isOwner={request.userId === user?.id}
          isDJ={user?.type === 'dj'}
        />
      ))}
    </div>
  );
} 