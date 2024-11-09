import { Dialog, DialogContent } from "@/components/ui/dialog";
import QrScanner from 'react-qr-scanner';

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

export function QRScannerDialog({ open, onOpenChange, onScan }: QRScannerDialogProps) {
  const handleScan = (data: { text: string } | null) => {
    if (data?.text) {
      onScan(data.text);
      onOpenChange(false);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <QrScanner
          onScan={handleScan}
          onError={handleError}
          style={{ width: '100%' }}
        />
      </DialogContent>
    </Dialog>
  );
}
