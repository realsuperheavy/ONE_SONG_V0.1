import { Html5QrcodeScanner } from 'html5-qrcode';
import { analyticsService } from '@/lib/firebase/services/analytics';

export class QRScanner {
  private scanner: Html5QrcodeScanner | null = null;

  initialize(elementId: string, onScan: (code: string) => void): void {
    try {
      this.scanner = new Html5QrcodeScanner(
        elementId,
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        false
      );

      this.scanner.render(
        (decodedText) => {
          onScan(decodedText);
          this.stop();
          analyticsService.trackEvent('qr_scan_success');
        },
        (error) => {
          console.error('QR scan error:', error);
          analyticsService.trackError(error, {
            context: 'qr_scan'
          });
        }
      );
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'qr_scanner_initialization'
      });
    }
  }

  stop(): void {
    if (this.scanner) {
      this.scanner.clear();
      this.scanner = null;
    }
  }
} 