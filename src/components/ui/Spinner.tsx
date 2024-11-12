interface SpinnerProps {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className={`animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full ${className}`} />
  );
} 