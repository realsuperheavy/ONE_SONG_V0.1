'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useQRScanner } from '@/hooks/useQRScanner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<void>;
}

export function QRScannerDialog({ open, onClose, onScan }: QRScannerDialogProps) {
  const { scanning, error, startScanning, stopScanning } = useQRScanner();

  useEffect(() => {
    if (open) {
      startScanning('qr-reader', async (code) => {
        try {
          await onScan(code);
          analyticsService.trackEvent('qr_code_scanned', {
            success: true
          });
        } catch (error) {
          analyticsService.trackEvent('qr_code_scanned', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, onScan, startScanning, stopScanning]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Scan Event QR Code</h2>
          {scanning && <LoadingSpinner />}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div id="qr-reader" className="w-full max-w-sm mx-auto" />
        </div>
      </DialogContent>
    </Dialog>
  );
} 