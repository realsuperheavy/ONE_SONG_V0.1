export const EventView: React.FC = () => {
  const { eventId } = useParams();
  const { event } = useEvent(eventId);
  const { currentSong } = useCurrentSong(eventId);
  const { queue } = useQueue(eventId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <AttendeeNavbar eventName={event?.name} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Now Playing */}
        <NowPlaying
          song={currentSong}
          className="rounded-xl overflow-hidden"
        />

        {/* Request and Queue Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <SongRequestSection eventId={eventId} />
          <QueueSection queue={queue} />
        </div>

        {/* Tipping Interface */}
        <TippingInterface
          eventId={eventId}
          djId={event?.djId}
        />
      </main>
    </div>
  );
}; 