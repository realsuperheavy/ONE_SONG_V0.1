import { EventStatusManager } from '@/components/events/EventStatusManager';
import { AttendeeListLive } from '@/components/events/AttendeeListLive';
import { QueueManager } from '@/components/events/QueueManager';
import { RequestManager } from '@/components/events/RequestManager';
import { useEventStore } from '@/store/event';
import { useAuthStore } from '@/store/auth';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface EventPageProps {
  params: {
    eventId: string;
  };
}

export default function EventPage({ params }: EventPageProps) {
  const { eventId } = params;
  const event = useEventStore((state) => state.currentEvent);
  const user = useAuthStore((state) => state.user);
  const isDJ = user?.type === 'dj' && event?.djId === user.id;

  if (!event) {
    return <div>Loading event...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <ErrorBoundary>
            {isDJ && (
              <EventStatusManager
                eventId={eventId}
                initialStatus={event.status}
                onStatusChange={(newStatus) => {
                  // Handle status change
                }}
              />
            )}
          </ErrorBoundary>

          <ErrorBoundary>
            <QueueManager
              eventId={eventId}
              onQueueUpdate={(queue) => {
                // Handle queue update
              }}
            />
          </ErrorBoundary>

          {isDJ && (
            <ErrorBoundary>
              <RequestManager
                eventId={eventId}
                onRequestUpdate={(request) => {
                  // Handle request update
                }}
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <ErrorBoundary>
            <AttendeeListLive
              eventId={eventId}
              maxHeight="calc(100vh - 200px)"
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
} 