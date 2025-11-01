import { Button } from "@/components/ui/button";
import { useMobileCapacitor } from "@/hooks/useMobileCapacitor";
import { ImpactStyle } from "@capacitor/haptics";
import { cn } from "@/lib/utils";

interface MobileActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  hapticStyle?: ImpactStyle;
  children: React.ReactNode;
}

export function MobileActionButton({
  variant = "default",
  size = "default",
  hapticStyle = ImpactStyle.Medium,
  className,
  onClick,
  children,
  ...props
}: MobileActionButtonProps) {
  const { triggerHaptic } = useMobileCapacitor();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    await triggerHaptic(hapticStyle);
    onClick?.(e);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "min-h-[44px] active:scale-[0.98] transition-transform",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}
