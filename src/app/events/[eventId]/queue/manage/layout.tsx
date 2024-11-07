'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { useEventStore } from '@/store/event';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface QueueManageLayoutProps {
  children: ReactNode;
}

export default function QueueManageLayout({ children }: QueueManageLayoutProps) {
  const params = useParams();
  const eventId = params.eventId as string;
  const user = useAuthStore((state) => state.user);
  const currentEvent = useEventStore((state) => state.currentEvent);

  if (user?.type !== 'dj') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Access denied. DJ access only.</p>
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
                Queue Management
              </h1>
              {currentEvent && (
                <p className="mt-1 text-sm text-gray-500">
                  {currentEvent.details.name}
                </p>
              )}
            </div>
            <nav className="flex space-x-4">
              <Link
                href={`/events/${eventId}/queue`}
                className="text-gray-500 hover:text-gray-700"
              >
                Queue View
              </Link>
              <Link
                href={`/events/${eventId}/requests`}
                className="text-gray-500 hover:text-gray-700"
              >
                Requests
              </Link>
              <Link
                href={`/events/${eventId}/settings`}
                className="text-gray-500 hover:text-gray-700"
              >
                Settings
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
    </div>
  );
} 