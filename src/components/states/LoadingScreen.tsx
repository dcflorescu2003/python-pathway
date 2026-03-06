import { Skeleton } from "@/components/ui/skeleton";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-background p-4 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
};

export default LoadingScreen;
