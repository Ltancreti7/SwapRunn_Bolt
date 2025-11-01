import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

interface ElasticScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  maxPullDistance?: number;
}

export function ElasticScrollContainer({
  children,
  className,
  maxPullDistance = 100,
}: ElasticScrollContainerProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isReleasing, setIsReleasing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Disable elastic scroll on homepage to prevent click interference
  const isHomepage = location.pathname === "/";

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || isHomepage) return;
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsReleasing(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || isHomepage || touchStartY.current === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    // Only allow pull down when at the top
    if (distance > 0 && container.scrollTop === 0) {
      // Add resistance - the further you pull, the harder it gets
      const resistance = Math.max(0.3, 1 - distance / maxPullDistance);
      const pullDist = Math.min(distance * resistance, maxPullDistance);
      setPullDistance(pullDist);

      // Prevent default scroll only when pulling
      if (pullDist > 5) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || isHomepage) return;

    if (pullDistance > 0) {
      setIsReleasing(true);
      // Bounce back animation
      setTimeout(() => {
        setPullDistance(0);
        touchStartY.current = 0;
        setTimeout(() => setIsReleasing(false), 300);
      }, 50);
    } else {
      touchStartY.current = 0;
    }
  };

  useEffect(() => {
    // Reset on unmount
    return () => {
      setPullDistance(0);
      touchStartY.current = 0;
    };
  }, []);

  if (!isMobile || isHomepage) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto overscroll-contain", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isReleasing
          ? "transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)"
          : "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Subtle visual indicator at top */}
      {pullDistance > 10 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translateY(-${Math.min(pullDistance, 40)}px)`,
            opacity: Math.min(pullDistance / 50, 0.6),
            transition: isReleasing ? "opacity 0.2s ease-out" : "none",
          }}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div
              className="w-1 h-1 rounded-full bg-white/60"
              style={{
                transform: `scale(${Math.min(pullDistance / 30, 1.5)})`,
                transition: "transform 0.1s ease-out",
              }}
            />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
