import { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';

interface QueueLayoutProps {
  children: ReactNode;
}

export default function QueueLayout({ children }: QueueLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
} 