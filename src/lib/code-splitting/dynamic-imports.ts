import dynamic from 'next/dynamic';

// Dynamic component imports
export const DynamicQRScanner = dynamic(
  () => import('@/components/QRScannerDialog').then(mod => mod.QRScannerDialog),
  { 
    loading: () => <div>Loading Scanner...</div>,
    ssr: false
  }
);

export const DynamicAnalytics = dynamic(
  () => import('@/components/analytics/AnalyticsDisplay'),
  { 
    loading: () => <div>Loading Analytics...</div>
  }
);

export const DynamicPaymentFlow = dynamic(
  () => import('@/components/payment/PaymentFlow'),
  { 
    loading: () => <div>Loading Payment...</div>,
    ssr: false
  }
); 