import dynamic from 'next/dynamic';
import { FC } from 'react';

// Dynamic component imports
export const DynamicQRScanner: FC = dynamic(
  () => import('@/components/QRScannerDialog').then(mod => mod.QRScannerDialog),
  { 
    loading: () => <div>Loading Scanner...</div>,
    ssr: false
  }
);

export const DynamicAnalytics: FC = dynamic(
  () => import('@/components/analytics/AnalyticsDisplay'),
  { 
    loading: () => <div>Loading Analytics...</div>
  }
);

export const DynamicPaymentFlow: FC = dynamic(
  () => import('@/components/payment/PaymentFlow'),
  { 
    loading: () => <div>Loading Payment...</div>,
    ssr: false
  }
);