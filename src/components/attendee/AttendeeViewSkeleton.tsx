import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentlyPlayingSkeleton } from "@/components/attendee/CurrentlyPlayingSkeleton";

export function AttendeeViewSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-4">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
        <CurrentlyPlayingSkeleton />
        <Card className="p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 