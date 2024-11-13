'use client';

import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circle' | 'rect';
  repeat?: number;
}

const shimmerAnimation = {
  '@keyframes shimmer': {
    '0%': {
      backgroundPosition: '-1000px 0'
    },
    '100%': {
      backgroundPosition: '1000px 0'
    }
  }
};

export function Shimmer({
  className,
  width,
  height,
  variant = 'rect',
  repeat = 1
}: ShimmerProps) {
  const items = Array.from({ length: repeat }, (_, i) => i);

  const ShimmerItem = () => (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-200 animate-pulse',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-md',
        variant === 'text' && 'rounded h-4 w-3/4',
        className
      )}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
      }}
    />
  );

  return (
    <div className="space-y-4">
      {items.map((i) => (
        <ShimmerItem key={i} />
      ))}
    </div>
  );
}

// Preset shimmer components
export function CardShimmer() {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <Shimmer variant="text" width="60%" />
      <Shimmer height={100} />
      <div className="space-y-2">
        <Shimmer variant="text" width="40%" />
        <Shimmer variant="text" width="80%" />
      </div>
    </div>
  );
}

export function ListShimmer({ items = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Shimmer variant="circle" width={40} height={40} />
          <div className="space-y-2 flex-1">
            <Shimmer variant="text" width="40%" />
            <Shimmer variant="text" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileShimmer() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Shimmer variant="circle" width={80} height={80} />
        <div className="space-y-2">
          <Shimmer variant="text" width={150} />
          <Shimmer variant="text" width={100} />
        </div>
      </div>
      <div className="space-y-4">
        <Shimmer variant="text" repeat={3} />
      </div>
    </div>
  );
} 