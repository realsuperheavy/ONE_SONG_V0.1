import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CurrentlyPlayingSkeleton() {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Now Playing</h2>
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="mt-2 space-y-1">
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 