'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LiveAnnouncerProps {
  assertive?: boolean;
}

export function LiveAnnouncer({ assertive = false }: LiveAnnouncerProps) {
  const [message, setMessage] = useState('');
  const [previousMessage, setPreviousMessage] = useState('');

  useEffect(() => {
    const handleAnnouncement = (event: CustomEvent) => {
      const newMessage = event.detail?.message || '';
      setPreviousMessage(message);
      setMessage(newMessage);

      // Clear message after screen reader has time to announce it
      setTimeout(() => {
        setMessage('');
      }, 1000);
    };

    window.addEventListener('announce', handleAnnouncement as EventListener);
    return () => {
      window.removeEventListener('announce', handleAnnouncement as EventListener);
    };
  }, [message]);

  return createPortal(
    <div 
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
      <div aria-hidden="true" className="hidden">
        {previousMessage}
      </div>
    </div>,
    document.body
  );
}

// Utility function to trigger announcements
export const announce = (message: string, assertive = false) => {
  const event = new CustomEvent('announce', {
    detail: { message, assertive }
  });
  window.dispatchEvent(event);
}; 