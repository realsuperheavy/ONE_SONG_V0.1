import { useEffect, useState } from 'react';
import { FirebaseDebugger } from '@/lib/firebase/services/firebase-debugger';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { DiagnosisReport } from '@/debug/types';

export function useEventConnection(eventId: string) {
  const [connected, setConnected] = useState(false);
  const [diagnosisReport, setDiagnosisReport] = useState<DiagnosisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debugger = new FirebaseDebugger(eventId);
    let interval: NodeJS.Timeout;

    const checkConnection = async () => {
      try {
        const diagnosis = await debugger.diagnoseRealTimeIssue();
        setDiagnosisReport(diagnosis);
        
        if (!diagnosis.connectivity.isConnected) {
          await debugger.forceReconnect();
        }
        
        setConnected(diagnosis.connectivity.isConnected);
        
        analyticsService.trackEventActivity(eventId, 'connection_check', {
          connected: diagnosis.connectivity.isConnected,
          healthStatus: diagnosis.healthStatus
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Connection check failed');
        analyticsService.trackError(error as Error, {
          context: 'event_connection',
          eventId
        });
      }
    };

    // Initial check
    checkConnection();

    // Periodic checks
    interval = setInterval(checkConnection, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [eventId]);

  return { connected, diagnosisReport, error };
} 