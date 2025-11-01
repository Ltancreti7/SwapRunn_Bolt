import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingSpinner } from "@/components/ui/LoadingStates";
interface MobilePullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}
export function MobilePullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: MobilePullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || disabled || isRefreshing) return;
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || disabled || isRefreshing || touchStartY.current === 0)
      return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;
    if (distance > 0) {
      e.preventDefault();
      const pullDist = Math.min(distance * 0.4, MAX_PULL);
      setPullDistance(pullDist);
      setIsPulling(pullDist > 20);
    }
  };
  const handleTouchEnd = async () => {
    if (!isMobile || disabled || isRefreshing) return;
    if (pullDistance > PULL_THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
    touchStartY.current = 0;
  };
  useEffect(() => {
    if (isRefreshing) {
      setPullDistance(PULL_THRESHOLD);
    } else if (!isPulling) {
      setPullDistance(0);
    }
  }, [isRefreshing, isPulling]);
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }
  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
        style={{
          height: `${pullDistance}px`,
          transform: `translateY(-${pullDistance}px)`,
          opacity: pullDistance > 20 ? 1 : 0,
          transition: "opacity 0.2s ease-out",
        }}
      ></div>

      {children}
    </div>
  );
}
