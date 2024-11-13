'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  className
}: ModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const [modalPosition, setModalPosition] = useState<'center' | 'bottom'>('center');

  useEffect(() => {
    setModalPosition(isMobile ? 'bottom' : 'center');
  }, [isMobile]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container for positioning */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={cn(
            'w-full max-w-md transform overflow-hidden rounded-t-lg bg-white p-6 shadow-xl transition-all',
            modalPosition === 'bottom' && 'fixed bottom-0 rounded-b-none',
            modalPosition === 'center' && 'relative rounded-lg',
            isTablet && 'max-w-lg',
            className
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">
              {title}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={cn(
            'overflow-y-auto',
            modalPosition === 'bottom' ? 'max-h-[70vh]' : 'max-h-[80vh]'
          )}>
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 