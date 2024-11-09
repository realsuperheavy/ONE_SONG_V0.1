declare module 'react-qr-scanner' {
  interface QrScannerProps {
    onScan: (data: { text: string } | null) => void;
    onError: (error: any) => void;
    style?: React.CSSProperties;
  }
  
  const QrScanner: React.FC<QrScannerProps>;
  export default QrScanner;
} 