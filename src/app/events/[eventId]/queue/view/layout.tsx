'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { useEventStore } from '@/store/event';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface QueueViewLayoutProps {
  children: ReactNode;
}

export default function QueueViewLayout({ children }: QueueViewLayoutProps) {
  const params = useParams();
  const eventId = params.eventId as string;
  const user = useAuthStore((state) => state.user);
  const currentEvent = useEventStore((state) => state.currentEvent);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please sign in to view the queue.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Event Queue
              </h1>
              {currentEvent && (
                <p className="mt-1 text-sm text-gray-500">
                  {currentEvent.details.name}
                </p>
              )}
            </div>
            <nav className="flex space-x-4">
              <Link
                href={`/events/${eventId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                Event Details
              </Link>
              <Link
                href={`/events/${eventId}/request`}
                className="text-gray-500 hover:text-gray-700"
              >
                Make Request
              </Link>
              <Link
                href={`/events/${eventId}/my-requests`}
                className="text-gray-500 hover:text-gray-700"
              >
                My Requests
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          {children}
        </div>
      </main>

      {/* Footer with Event Stats */}
      {currentEvent && (
        <footer className="bg-white shadow mt-8">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-around text-sm text-gray-500">
              <span>
                Queue Size: {currentEvent.settings.maxQueueSize}
              </span>
              <span>
                Total Requests: {currentEvent.stats.requestCount}
              </span>
              {currentEvent.settings.allowTips && (
                <span>
                  Total Tips: ${currentEvent.stats.totalTips}
                </span>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
} 