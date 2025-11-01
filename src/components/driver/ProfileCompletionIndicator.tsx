import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCompletionIndicatorProps {
  driverData: any;
  className?: string;
}

export const ProfileCompletionIndicator = ({
  driverData,
  className,
}: ProfileCompletionIndicatorProps) => {
  // Calculate completion metrics
  const completionChecks = [
    { key: "basic_info", completed: !!(driverData?.name && driverData?.email) },
    { key: "phone", completed: !!driverData?.phone },
    {
      key: "background_check",
      completed: driverData?.checkr_status === "approved",
    },
    { key: "rating", completed: (driverData?.rating_avg || 0) >= 4.5 },
  ];

  const completedCount = completionChecks.filter(
    (check) => check.completed,
  ).length;
  const totalCount = completionChecks.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  // Determine status
  const getStatus = () => {
    if (completionPercentage === 100) {
      return {
        label: "Complete",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      };
    } else if (completionPercentage >= 75) {
      return {
        label: "Almost Ready",
        variant: "secondary" as const,
        icon: Clock,
        color: "text-yellow-600",
      };
    } else {
      return {
        label: "Setup Needed",
        variant: "destructive" as const,
        icon: AlertCircle,
        color: "text-red-600",
      };
    }
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", status.color)} />
          <span className="text-sm font-medium">Profile Status</span>
        </div>
        <Badge variant={status.variant} className="text-xs">
          {status.label}
        </Badge>
      </div>

      <div className="space-y-1">
        <Progress value={completionPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {completedCount}/{totalCount} items complete
          </span>
          <span>{Math.round(completionPercentage)}%</span>
        </div>
      </div>

      {completionPercentage < 100 && (
        <div className="text-xs text-muted-foreground">
          Complete your profile to unlock all features
        </div>
      )}
    </div>
  );
};
