import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export function MobileSkeleton({
  className,
  lines = 3,
  avatar = false,
}: MobileSkeletonProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "animate-pulse",
        isMobile ? "p-4 rounded-2xl bg-card" : "p-6 rounded-xl bg-card",
        className,
      )}
    >
      <div className="flex items-start space-x-3">
        {avatar && (
          <div
            className={cn(
              "rounded-full bg-muted",
              isMobile ? "w-10 h-10" : "w-12 h-12",
            )}
          />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3 bg-muted rounded",
                i === 0 && "w-3/4",
                i === 1 && "w-1/2",
                i > 1 && "w-2/3",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MobileCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MobileSkeleton key={i} avatar />
      ))}
    </div>
  );
}
