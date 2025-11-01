import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  driveTrackingService,
  DriveStats,
} from "@/services/driveTrackingService";
import { ChatButton } from "@/components/chat/ChatButton";
import {
  Calendar,
  MapPin,
  Play,
  CheckCircle,
  Clock,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";
import VehicleInspectionModal from "./VehicleInspectionModal";

interface JobData {
  id: string;
  type: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  make?: string;
  model?: string;
  year?: number;
}

interface DriveTrackingCardProps {
  job: JobData;
  assignmentId: string;
  driverId: string;
  onDriveComplete: () => void;
}

export function DriveTrackingCard({
  job,
  assignmentId,
  driverId,
  onDriveComplete,
}: DriveTrackingCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [driveStats, setDriveStats] = useState<DriveStats | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  useEffect(() => {
    // Check if this job is currently being tracked
    const activeDrive = driveTrackingService.getActiveDrive();
    if (activeDrive && activeDrive.jobId === job.id) {
      setIsTracking(true);
      setDriveStats(driveTrackingService.getCurrentDriveStats());
    }

    // Subscribe to drive updates
    const handleStatsUpdate = (stats: DriveStats) => {
      const currentDrive = driveTrackingService.getActiveDrive();
      if (currentDrive && currentDrive.jobId === job.id) {
        setDriveStats(stats);
      }
    };

    driveTrackingService.subscribe(handleStatsUpdate);

    return () => {
      driveTrackingService.unsubscribe(handleStatsUpdate);
    };
  }, [job.id]);

  const formatJobTitle = (job: JobData) => {
    if (job.make && job.model && job.year) {
      return `${job.year} ${job.make} ${job.model}`;
    }
    return `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job`;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      assigned: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      open: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const handleStartDrive = () => {
    setShowInspectionModal(true);
  };

  const handleInspectionComplete = async (photoUrls: string[]) => {
    setShowInspectionModal(false);
    setIsLoading(true);

    try {
      await driveTrackingService.startDrive(assignmentId, job.id, driverId);
      setIsTracking(true);

      toast({
        title: "Drive Started",
        description: "Vehicle inspection complete. GPS tracking is now active!",
      });
    } catch (error) {
      console.error("Error starting drive:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start drive tracking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteDrive = async () => {
    try {
      setIsLoading(true);
      await driveTrackingService.completeDrive();
      setIsTracking(false);
      setDriveStats(null);

      toast({
        title: "Drive Completed",
        description: "Great job! Your drive has been successfully completed.",
      });

      onDriveComplete();
    } catch (error) {
      console.error("Error completing drive:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete drive",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold">{formatJobTitle(job)}</h3>
            <Badge className={getStatusBadge(job.status)}>
              {isTracking ? "In Progress" : job.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(job.created_at), "MMM d, yyyy")}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <span className="text-sm font-medium">Pickup: </span>
              <span className="text-sm">{job.pickup_address}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <span className="text-sm font-medium">Delivery: </span>
              <span className="text-sm">{job.delivery_address}</span>
            </div>
          </div>
          {job.customer_name && (
            <div className="text-sm">
              <span className="font-medium">Customer: </span>
              {job.customer_name}
            </div>
          )}
        </div>

        {/* Real-time tracking stats */}
        {isTracking && driveStats && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Live Tracking</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Time:</span>
                <div className="font-semibold">{driveStats.elapsedTime}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Distance:</span>
                <div className="font-semibold">
                  {driveStats.totalDistance.toFixed(1)} mi
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleStartDrive}
              variant="success"
              disabled={isLoading || isTracking}
              className="h-11"
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading && !isTracking ? "Starting..." : "Start Drive"}
            </Button>
            <Button
              onClick={handleCompleteDrive}
              variant="default"
              disabled={isLoading || !isTracking}
              className="h-11"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isLoading && isTracking ? "Completing..." : "Complete Drive"}
            </Button>
          </div>

          {/* Chat Button */}
          <div className="flex justify-center">
            <ChatButton
              jobId={job.id}
              assignmentId={assignmentId}
              currentUserType="driver"
              currentUserId={driverId}
              size="default"
            />
          </div>
        </div>
      </CardContent>

      <VehicleInspectionModal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        onComplete={handleInspectionComplete}
        jobId={job.id}
        assignmentId={assignmentId}
        vehicleInfo={{
          make: job.make,
          model: job.model,
          year: job.year,
        }}
      />
    </Card>
  );
}
