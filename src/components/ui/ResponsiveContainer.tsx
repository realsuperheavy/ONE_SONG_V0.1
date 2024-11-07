import { cn } from '@/lib/utils';
import { RESPONSIVE } from '@/design/tokens';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: keyof typeof RESPONSIVE.container;
  className?: string;
  fullHeight?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  className,
  fullHeight = false
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6 lg:px-8',
        RESPONSIVE.container[maxWidth],
        fullHeight && 'min-h-screen',
        isMobile && 'px-2',
        className
      )}
      role="main"
    >
      {children}
    </div>
  );
}; 