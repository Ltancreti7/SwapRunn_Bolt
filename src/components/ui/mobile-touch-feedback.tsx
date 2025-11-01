import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileTouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "subtle" | "strong";
}

export function MobileTouchFeedback({
  children,
  className,
  onClick,
  disabled = false,
  variant = "default",
}: MobileTouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isMobile = useIsMobile();

  const handleTouchStart = () => {
    if (!disabled && isMobile) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (!disabled && onClick) {
      onClick();
    }
  };

  const scaleVariants = {
    default: "active:scale-[0.98]",
    subtle: "active:scale-[0.995]",
    strong: "active:scale-[0.95]",
  };

  return (
    <div
      className={cn(
        "transition-transform duration-150 ease-out cursor-pointer select-none",
        !disabled && scaleVariants[variant],
        isPressed && isMobile && "transform scale-[0.98]",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={!isMobile ? handleTouchStart : undefined}
      onMouseUp={!isMobile ? handleTouchEnd : undefined}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
}
