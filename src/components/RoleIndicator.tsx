import { Badge } from "@/components/ui/badge";
import { User, Building2, Car } from "lucide-react";

interface RoleIndicatorProps {
  userType: string;
  className?: string;
  showIcon?: boolean;
}

export function RoleIndicator({
  userType,
  className = "",
  showIcon = true,
}: RoleIndicatorProps) {
  const roleConfig = {
    dealer: {
      label: "Dealer",
      icon: Building2,
      variant: "secondary" as const,
    },
    driver: {
      label: "Driver",
      icon: Car,
      variant: "outline" as const,
    },
  };

  const config = roleConfig[userType as keyof typeof roleConfig] || {
    label: userType,
    icon: User,
    variant: "secondary" as const,
  };

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`inline-flex items-center gap-1.5 text-white ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}
