'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { RequestList } from '@/components/requests/RequestList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useParams } from 'next/navigation';

export default function MyRequestsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please sign in to view your requests.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Requests</h1>
        <p className="text-gray-600">Track the status of your song requests</p>
      </div>
      <RequestList eventId={eventId} userId={user.id} />
    </div>
  );
} 