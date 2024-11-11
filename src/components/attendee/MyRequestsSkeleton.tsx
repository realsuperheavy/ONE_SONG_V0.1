import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MyRequestsSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-7 w-40 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </Card>
  );
} 