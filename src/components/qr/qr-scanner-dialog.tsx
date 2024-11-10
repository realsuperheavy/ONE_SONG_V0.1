import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}

function Alert({ variant = 'default', children }: AlertProps) {
  return (
    <div className={`p-4 rounded-md ${variant === 'destructive' ? 'bg-red-50 text-red-900' : 'bg-gray-50 text-gray-900'}`}>
      {children}
    </div>
  );
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="ml-6">{children}</div>;
}

export function QRScannerDialog({ open, onOpenChange, onScan }: QRScannerDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  useEffect(() => {
    if (!open) {
      if (scanner) {
        scanner.clear();
        setScanner(null);
      }
      return;
    }

    const initializeScanner = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        // Check camera availability
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        if (!hasCamera) {
          throw new Error('No camera found on your device');
        }

        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);

        // Initialize QR scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          showTorchButtonIfSupported: true,
          videoConstraints: {
            facingMode: { ideal: 'environment' }
          }
        };

        const newScanner = new Html5QrcodeScanner(
          scannerContainerId,
          config,
          false
        );

        await newScanner.render(
          (decodedText: string) => {
            // Extract event code from URL or use code directly
            const code = decodedText.includes('/event/') 
              ? decodedText.split('/event/')[1]
              : decodedText;

            // Validate code format (6 characters)
            if (/^[A-Z0-9]{6}$/.test(code)) {
              onScan(code);
              onOpenChange(false);
            }
          },
          (errorMessage: string) => {
            // Ignore scanning errors as they're expected when no QR code is in view
          }
        );

        setScanner(newScanner);
        setIsInitializing(false);
      } catch (err) {
        let message = 'Failed to initialize camera';
        
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            message = 'Camera access denied. Please enable camera permissions in your browser settings.';
            setHasPermission(false);
          } else if (err.name === 'NotFoundError') {
            message = 'No camera found on your device.';
          } else if (err.name === 'NotReadableError') {
            message = 'Camera is already in use by another application.';
          }
        }
        
        setError(message);
        setIsInitializing(false);
      }
    };

    initializeScanner();
  }, [open, onScan, onOpenChange]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen && scanner) {
          scanner.clear();
          setScanner(null);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Event QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              {hasPermission === false ? (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setError(null);
                    setIsInitializing(true);
                    if (scanner) {
                      scanner.clear();
                      setScanner(null);
                    }
                  }}
                  className="w-full gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <div id={scannerContainerId} className="w-full h-full" />
                {isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Position the QR code within the frame to scan
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}