import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MobileOptimizedCard({
  children,
  className,
  clickable = false,
  onClick,
  icon,
  title,
  subtitle,
}: MobileOptimizedCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        clickable && "hover:shadow-lg active:scale-[0.98] cursor-pointer",
        isMobile && "min-h-[44px] rounded-2xl shadow-sm",
        !isMobile && "rounded-xl",
        className,
      )}
      onClick={onClick}
    >
      {title && (
        <CardHeader className={cn("pb-3", isMobile && "pb-2 px-4 pt-4")}>
          <CardTitle
            className={cn(
              "flex items-center",
              isMobile && "text-base font-semibold",
            )}
          >
            {icon && <span className="mr-2">{icon}</span>}
            <div className="flex-1">
              {title}
              {subtitle && (
                <div
                  className={cn(
                    "text-xs text-muted-foreground font-normal mt-1",
                    isMobile && "text-sm",
                  )}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(isMobile && "px-4 pb-4")}>
        {children}
      </CardContent>
    </Card>
  );
}
