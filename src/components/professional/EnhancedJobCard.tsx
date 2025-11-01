import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, User, Phone, Car } from "lucide-react";
import { useProfessionalJob } from "@/hooks/useProfessionalJob";
import { useAuth } from "@/hooks/useAuth";

interface Job {
  id: string;
  type: string;
  status: string;
  year?: number;
  make?: string;
  model?: string;
  pickup_address?: string;
  delivery_address?: string;
  distance_miles?: number;
  estimated_pay_cents?: number;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
  track_token?: string;
  assignments?: Array<{
    id: string;
    driver_id: string;
    drivers?: {
      name: string;
      phone?: string;
    };
  }>;
}

interface EnhancedJobCardProps {
  job: Job;
  viewType: "dealer" | "driver";
  onJobUpdate?: () => void;
}

export const EnhancedJobCard: React.FC<EnhancedJobCardProps> = ({
  job,
  viewType,
  onJobUpdate,
}) => {
  const { user } = useAuth();
  const { assignJob, startJob, completeJob, cancelJob, isLoading } =
    useProfessionalJob({
      jobId: job.id,
      enableRealtime: true,
    });

  const assignment = job.assignments?.[0];
  const driver = assignment?.drivers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "assigned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "in_progress":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const handleAutoAssign = async () => {
    try {
      await assignJob(undefined, "auto");
      onJobUpdate?.();
    } catch (error) {
      console.error("Auto-assignment failed:", error);
    }
  };

  const handleStartJob = async () => {
    try {
      await startJob(assignment?.id);
      onJobUpdate?.();
    } catch (error) {
      console.error("Start job failed:", error);
    }
  };

  const handleCompleteJob = async () => {
    try {
      await completeJob(assignment?.id);
      onJobUpdate?.();
    } catch (error) {
      console.error("Complete job failed:", error);
    }
  };

  const handleCancelJob = async () => {
    try {
      await cancelJob(assignment?.id, "Cancelled by user");
      onJobUpdate?.();
    } catch (error) {
      console.error("Cancel job failed:", error);
    }
  };

  return (
    <Card className="swaprunn-card hover:shadow-elegant transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {job.year} {job.make} {job.model}
            </CardTitle>
            <p className="text-sm text-muted-foreground">#{job.track_token}</p>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vehicle & Job Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{job.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm">{job.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p className="text-sm">{job.delivery_address}</p>
            </div>
          </div>
        </div>

        {/* Distance & Pay */}
        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {job.distance_miles} miles
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              ${((job.estimated_pay_cents || 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Driver Info (if assigned) */}
        {driver && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <User className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">{driver.name}</p>
              {driver.phone && (
                <p className="text-xs text-muted-foreground">{driver.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Customer Info */}
        {job.customer_name && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <User className="h-4 w-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium">{job.customer_name}</p>
              {job.customer_phone && (
                <p className="text-xs text-muted-foreground">
                  {job.customer_phone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {viewType === "dealer" && (
            <>
              {job.status === "open" && (
                <Button
                  onClick={handleAutoAssign}
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Auto Assign
                </Button>
              )}
              {job.status !== "completed" && job.status !== "cancelled" && (
                <Button
                  onClick={handleCancelJob}
                  disabled={isLoading}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Cancel
                </Button>
              )}
            </>
          )}

          {viewType === "driver" && assignment && (
            <>
              {job.status === "assigned" && (
                <Button
                  onClick={handleStartJob}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Job
                </Button>
              )}
              {job.status === "in_progress" && (
                <Button
                  onClick={handleCompleteJob}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Complete Job
                </Button>
              )}
              {(job.status === "assigned" || job.status === "in_progress") && (
                <Button
                  onClick={handleCancelJob}
                  disabled={isLoading}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
