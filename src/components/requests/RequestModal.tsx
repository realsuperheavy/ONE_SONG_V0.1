import { Dialog } from '@headlessui/react';
import { XIcon } from 'lucide-react';
import { RequestFormWithSearch } from './RequestFormWithSearch';

interface RequestModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RequestModal({ 
  eventId, 
  isOpen, 
  onClose,
  onSuccess 
}: RequestModalProps) {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleError = (error: Error) => {
    // You could integrate with a toast system here
    console.error('Request failed:', error);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        {/* Center modal contents */}
        <span
          className="inline-block h-screen align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900"
            >
              Request a Song
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          <RequestFormWithSearch
            eventId={eventId}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>
    </Dialog>
  );
} 