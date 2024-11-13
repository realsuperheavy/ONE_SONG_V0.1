import { useState, useCallback } from 'react';
import { QRScanner } from '@/lib/qr/QRScanner';
import { useToast } from '@/hooks/useToast';
import { analyticsService } from '@/lib/firebase/services/analytics';

export function useQRScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const scanner = new QRScanner();

  const startScanning = useCallback((elementId: string, onScan: (code: string) => void) => {
    try {
      setScanning(true);
      setError(null);
      scanner.initialize(elementId, (code) => {
        onScan(code);
        setScanning(false);
        analyticsService.trackEvent('qr_scan_complete');
      });
    } catch (error) {
      setError('Failed to initialize scanner');
      showToast({
        title: "Error",
        description: "Failed to start QR scanner",
        variant: "destructive"
      });
      analyticsService.trackError(error as Error, {
        context: 'qr_scanner_start'
      });
    }
  }, [showToast]);

  const stopScanning = useCallback(() => {
    scanner.stop();
    setScanning(false);
  }, []);

  return {
    scanning,
    error,
    startScanning,
    stopScanning
  };
} 