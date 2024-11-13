import { useState, useEffect } from 'react';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface OfflineState {
  isOnline: boolean;
  pendingRequests: Array<{
    type: 'request' | 'vote';
    data: any;
    timestamp: number;
  }>;
}

export function useOfflineSupport() {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    pendingRequests: []
  });

  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      analyticsService.trackEvent('network_status_change', { status: 'online' });
    };

    const handleOffline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: false }));
      analyticsService.trackEvent('network_status_change', { status: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addPendingRequest = (type: 'request' | 'vote', data: any) => {
    setOfflineState(prev => ({
      ...prev,
      pendingRequests: [
        ...prev.pendingRequests,
        { type, data, timestamp: Date.now() }
      ]
    }));
  };

  const processPendingRequests = async () => {
    if (!offlineState.isOnline || offlineState.pendingRequests.length === 0) {
      return;
    }

    const requests = [...offlineState.pendingRequests];
    setOfflineState(prev => ({ ...prev, pendingRequests: [] }));

    for (const request of requests) {
      try {
        // Process each request based on type
        analyticsService.trackEvent('process_offline_request', {
          type: request.type,
          success: true
        });
      } catch (error) {
        analyticsService.trackError(error as Error, {
          context: 'process_offline_request',
          type: request.type
        });
        // Re-add failed request
        addPendingRequest(request.type, request.data);
      }
    }
  };

  useEffect(() => {
    if (offlineState.isOnline) {
      processPendingRequests();
    }
  }, [offlineState.isOnline]);

  return {
    isOnline: offlineState.isOnline,
    hasPendingRequests: offlineState.pendingRequests.length > 0,
    addPendingRequest
  };
} 