import { useState, useEffect } from 'react';

export function useSpotifyAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Since we're using client credentials flow, we're always "authenticated"
    setIsAuthenticated(true);
    setIsInitializing(false);
  }, []);

  return {
    isAuthenticated,
    isInitializing
  };
} 