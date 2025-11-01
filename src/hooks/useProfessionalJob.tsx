import { useState, useEffect, useCallback } from "react";
import {
  ProfessionalJobService,
  JobStatusUpdateRequest,
} from "@/services/professionalJobService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface UseProfessionalJobOptions {
  jobId?: string;
  enableRealtime?: boolean;
}

export const useProfessionalJob = ({
  jobId,
  enableRealtime = false,
}: UseProfessionalJobOptions) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [jobUpdates, setJobUpdates] = useState<any[]>([]);

  // Smart job assignment
  const assignJob = useCallback(
    async (driverId?: string, preference: "auto" | "manual" = "manual") => {
      if (!jobId) throw new Error("Job ID required");

      setIsLoading(true);
      try {
        const result = await ProfessionalJobService.assignJob({
          jobId,
          driverId,
          dealerPreference: preference,
        });

        toast({
          title: "Job Assigned Successfully",
          description: `Job assigned ${preference === "auto" ? "automatically" : "manually"} to driver`,
        });

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to assign job";
        toast({
          title: "Assignment Failed",
          description: message,
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [jobId, toast],
  );

  // Professional status updates
  const updateJobStatus = useCallback(
    async (
      newStatus: "assigned" | "in_progress" | "completed" | "cancelled",
      options?: {
        assignmentId?: string;
        location?: { latitude: number; longitude: number };
        notes?: string;
      },
    ) => {
      if (!jobId || !user?.id) throw new Error("Job ID and user required");

      setIsLoading(true);
      try {
        const request: JobStatusUpdateRequest = {
          jobId,
          newStatus,
          userId: user.id,
          ...options,
        };

        const result = await ProfessionalJobService.updateJobStatus(request);

        toast({
          title: "Status Updated",
          description: `Job status changed to ${newStatus}`,
        });

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update status";
        toast({
          title: "Update Failed",
          description: message,
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [jobId, user?.id, toast],
  );

  // Start job (driver)
  const startJob = useCallback(
    async (
      assignmentId?: string,
      location?: { latitude: number; longitude: number },
    ) => {
      return updateJobStatus("in_progress", { assignmentId, location });
    },
    [updateJobStatus],
  );

  // Complete job (driver)
  const completeJob = useCallback(
    async (
      assignmentId?: string,
      location?: { latitude: number; longitude: number },
    ) => {
      return updateJobStatus("completed", { assignmentId, location });
    },
    [updateJobStatus],
  );

  // Cancel job (dealer or driver)
  const cancelJob = useCallback(
    async (assignmentId?: string, reason?: string) => {
      return updateJobStatus("cancelled", { assignmentId, notes: reason });
    },
    [updateJobStatus],
  );

  // Send notification
  const sendNotification = useCallback(
    async (
      type: "assignment" | "status_update" | "completion" | "cancellation",
      options?: {
        driverId?: string;
        dealerId?: string;
        customMessage?: string;
      },
    ) => {
      if (!jobId) throw new Error("Job ID required");

      try {
        const result = await ProfessionalJobService.sendNotification({
          jobId,
          notificationType: type,
          ...options,
        });

        return result;
      } catch (error) {
        console.error("Notification error:", error);
        // Don't throw - notifications are not critical for job operations
      }
    },
    [jobId],
  );

  // Real-time monitoring
  useEffect(() => {
    if (!enableRealtime || !jobId) return;

    const cleanup = ProfessionalJobService.setupJobMonitoring(
      jobId,
      (update) => {
        setJobUpdates((prev) => [
          ...prev,
          {
            ...update,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Show toast for important updates
        if (
          update.type === "job_update" &&
          update.data.status !== update.old.status
        ) {
          toast({
            title: "Job Status Changed",
            description: `Status updated to ${update.data.status}`,
          });
        } else if (
          update.type === "assignment_update" &&
          update.event === "INSERT"
        ) {
          toast({
            title: "Driver Assigned",
            description: "A driver has been assigned to this job",
          });
        } else if (update.type === "new_message") {
          toast({
            title: "New Message",
            description: "You have a new message for this job",
          });
        }
      },
    );

    return cleanup;
  }, [enableRealtime, jobId, toast]);

  return {
    // Actions
    assignJob,
    updateJobStatus,
    startJob,
    completeJob,
    cancelJob,
    sendNotification,

    // State
    isLoading,
    jobUpdates,

    // Utilities
    clearUpdates: () => setJobUpdates([]),
  };
};
