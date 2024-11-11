import { Skeleton } from '@/components/ui/skeleton';

export default function EventPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    </div>
  );
} 