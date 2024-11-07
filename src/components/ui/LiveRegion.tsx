import { useEffect, useState } from 'react';

interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  clearAfter?: number;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  'aria-atomic': atomic = true,
  clearAfter
}) => {
  const [content, setContent] = useState(children);

  useEffect(() => {
    setContent(children);

    if (clearAfter) {
      const timer = setTimeout(() => {
        setContent(null);
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [children, clearAfter]);

  if (!content) return null;

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
    >
      {content}
    </div>
  );
}; 