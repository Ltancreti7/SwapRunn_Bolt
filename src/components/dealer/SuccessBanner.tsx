import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessBannerProps {
  show: boolean;
  message: string;
  onDismiss: () => void;
}

export const SuccessBanner = ({
  show,
  message,
  onDismiss,
}: SuccessBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [headerOffset, setHeaderOffset] = useState<number>(16);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  useEffect(() => {
    const computeOffset = () => {
      const header = document.querySelector(".sr-header") as HTMLElement | null;
      const height = header?.getBoundingClientRect().height ?? 0;
      setHeaderOffset(height + 8);
    };

    computeOffset();
    window.addEventListener(
      "resize",
      computeOffset as any,
      { passive: true } as any,
    );
    window.addEventListener(
      "scroll",
      computeOffset as any,
      { passive: true } as any,
    );
    return () => {
      window.removeEventListener("resize", computeOffset as any);
      window.removeEventListener("scroll", computeOffset as any);
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onDismiss();
    }, 300); // Match fade-out animation duration
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-[80] px-4",
        isExiting ? "animate-fade-out" : "animate-slide-in-from-top",
      )}
      style={{ top: headerOffset }}
      onClick={handleDismiss}
    >
      <div className="max-w-3xl mx-auto bg-green-600 text-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-green-700 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-bold text-sm sm:text-base">{message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Dismiss notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
