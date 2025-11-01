import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Mobile-optimized skeleton loader components
export const SkeletonCard = ({ className }: { className?: string }) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        isMobile ? "rounded-2xl p-4" : "rounded-lg p-4",
        className,
      )}
    >
      <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => {
  const isMobile = useIsMobile();

  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex space-x-4",
            isMobile ? "p-3 rounded-2xl bg-card" : "p-4",
          )}
        >
          <div className="h-4 bg-muted-foreground/20 rounded flex-1"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonForm = () => {
  const isMobile = useIsMobile();

  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
      <div
        className={cn(
          "bg-muted-foreground/20 rounded",
          isMobile ? "h-12 rounded-2xl" : "h-10",
        )}
      ></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
      <div
        className={cn(
          "bg-muted-foreground/20 rounded",
          isMobile ? "h-12 rounded-2xl" : "h-10",
        )}
      ></div>
      <div className="h-4 bg-muted-foreground/20 rounded w-1/4 mb-2"></div>
      <div
        className={cn(
          "bg-muted-foreground/20 rounded",
          isMobile ? "h-24 rounded-2xl" : "h-20",
        )}
      ></div>
    </div>
  );
};

// Loading spinner component
export const LoadingSpinner = ({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary/20 border-t-primary",
        sizeClasses[size],
        className,
      )}
    />
  );
};

// Full page loading component
export const PageLoader = ({
  message = "Loading...",
}: {
  message?: string;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <LoadingSpinner size="lg" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

// Optimistic UI component for job acceptance
export const OptimisticJobUpdate = ({
  isLoading,
  success,
  error,
  children,
}: {
  isLoading: boolean;
  success?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "transition-all duration-300",
      isLoading && "opacity-50 pointer-events-none",
      success && "ring-2 ring-green-500/50",
      error && "ring-2 ring-red-500/50",
    )}
  >
    {children}
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
        <LoadingSpinner />
      </div>
    )}
  </div>
);
