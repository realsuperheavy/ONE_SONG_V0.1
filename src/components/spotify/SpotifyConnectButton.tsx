import { useSpotify } from '@/lib/spotify/SpotifyContext';
import { useAuthStore } from '@/store/auth';

interface SpotifyConnectButtonProps {
  className?: string;
}

export function SpotifyConnectButton({ className = '' }: SpotifyConnectButtonProps) {
  const { isAuthenticated, isInitializing, connect, disconnect } = useSpotify();
  const user = useAuthStore((state) => state.user);

  if (isInitializing) {
    return null;
  }

  const handleClick = () => {
    if (isAuthenticated) {
      disconnect();
    } else {
      connect(user?.type || 'attendee');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${className}`}
    >
      {isAuthenticated ? 'Disconnect Spotify' : 'Connect Spotify'}
    </button>
  );
} 