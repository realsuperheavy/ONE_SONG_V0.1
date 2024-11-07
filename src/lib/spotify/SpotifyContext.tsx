import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { spotifyAuthService } from './services/auth';

interface SpotifyContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
  accessToken: string | null;
  connect: (userType: 'dj' | 'attendee') => void;
  disconnect: () => void;
}

const SpotifyContext = createContext<SpotifyContextType | null>(null);

interface SpotifyProviderProps {
  children: ReactNode;
}

export function SpotifyProvider({ children }: SpotifyProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  // Initialize Spotify state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    const expiresAt = localStorage.getItem('spotify_expires_at');

    if (token && refreshToken && expiresAt) {
      const now = Date.now();
      if (now < parseInt(expiresAt)) {
        setAccessToken(token);
        setIsAuthenticated(true);
      } else {
        // Token expired, try to refresh
        refreshAccessToken(refreshToken);
      }
    }
    setIsInitializing(false);
  }, []);

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const newAccessToken = await spotifyAuthService.refreshAccessToken(refreshToken);
      setAccessToken(newAccessToken);
      setIsAuthenticated(true);
      
      // Update localStorage
      localStorage.setItem('spotify_access_token', newAccessToken);
      localStorage.setItem('spotify_expires_at', (Date.now() + 3600 * 1000).toString());
    } catch (error) {
      setError('Failed to refresh Spotify access token');
      disconnect();
    }
  };

  const connect = (userType: 'dj' | 'attendee') => {
    const authUrl = spotifyAuthService.generateAuthUrl(userType);
    window.location.href = authUrl;
  };

  const disconnect = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    setError(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
  };

  return (
    <SpotifyContext.Provider
      value={{
        isAuthenticated,
        isInitializing,
        error,
        accessToken,
        connect,
        disconnect
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
} 