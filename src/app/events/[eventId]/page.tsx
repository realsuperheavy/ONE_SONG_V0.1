import { Suspense } from 'react';
import { EventStatusManager } from '@/components/events/EventStatusManager';
import { AttendeeListLive } from '@/components/events/AttendeeListLive';
import { QueueManager } from '@/components/events/QueueManager';
import { RequestManager } from '@/components/events/RequestManager';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// This remains a server component
export default async function EventPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <ErrorBoundary>
            <Suspense fallback={<div>Loading status...</div>}>
              <EventStatusManager eventId={eventId} />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary>
            <Suspense fallback={<div>Loading queue...</div>}>
              <QueueManager eventId={eventId} />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary>
            <Suspense fallback={<div>Loading requests...</div>}>
              <RequestManager eventId={eventId} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <ErrorBoundary>
            <Suspense fallback={<div>Loading attendees...</div>}>
              <AttendeeListLive eventId={eventId} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
} 