import { useEffect, useState } from 'react';

interface LiveRegionProps {
  children: React.ReactNode;
  clearAfter?: number;
  'aria-live'?: 'polite' | 'assertive';
  'aria-atomic'?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  clearAfter,
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true
}) => {
  const [content, setContent] = useState<React.ReactNode>(children);

  useEffect(() => {
    setContent(children);

    if (clearAfter) {
      const timer = setTimeout(() => {
        setContent(null);
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [children, clearAfter]);

  return (
    <div
      role="status"
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className="sr-only"
    >
      {content}
    </div>
  );
}; 