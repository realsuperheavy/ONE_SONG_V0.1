export const DJDashboard: React.FC = () => {
  const { eventId } = useParams();
  const { data: eventData, isLoading } = useEvent(eventId);
  const { queue, updateQueue } = useQueue(eventId);
  const { requests } = useRequests(eventId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <DJNavbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Event Header */}
        <EventHeader 
          event={eventData} 
          isLoading={isLoading} 
        />

        <div className="grid grid-cols-12 gap-6 mt-8">
          {/* Queue Management */}
          <div className="col-span-8">
            <QueueManager 
              queue={queue}
              onQueueUpdate={updateQueue}
            />
          </div>

          {/* Request Panel */}
          <div className="col-span-4">
            <RequestPanel 
              requests={requests}
              eventId={eventId}
            />
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mt-8">
          <AnalyticsPanel eventId={eventId} />
        </div>
      </div>
    </div>
  );
}; 