import { useState } from 'react';
import { useSpotify } from '@/lib/spotify/SpotifyContext';
import { RequestModal } from './RequestModal';
import { SpotifyConnectButton } from '@/components/spotify/SpotifyConnectButton';

interface RequestButtonProps {
  eventId: string;
  className?: string;
}

export function RequestButton({ eventId, className = '' }: RequestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, isInitializing } = useSpotify();

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <SpotifyConnectButton className={className} />;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
      >
        Request a Song
      </button>

      <RequestModal
        eventId={eventId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // You could show a success toast here
          console.log('Request successful');
        }}
      />
    </>
  );
} 