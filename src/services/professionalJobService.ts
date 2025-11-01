import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface JobAssignmentRequest {
  jobId: string;
  driverId?: string;
  dealerPreference?: "auto" | "manual";
}

export interface JobStatusUpdateRequest {
  jobId: string;
  assignmentId?: string;
  newStatus: "assigned" | "in_progress" | "completed" | "cancelled";
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface NotificationRequest {
  driverId?: string;
  dealerId?: string;
  jobId: string;
  notificationType:
    | "assignment"
    | "status_update"
    | "completion"
    | "cancellation";
  customMessage?: string;
}

export class ProfessionalJobService {
  /**
   * Smart job assignment using algorithm-based driver selection
   */
  static async assignJob(request: JobAssignmentRequest) {
    try {
      const { data, error } = await supabase.functions.invoke(
        "job-assignment-algorithm",
        {
          body: request,
        },
      );

      if (error) {
        throw new Error(error.message || "Failed to assign job");
      }

      return data;
    } catch (error) {
      console.error("Job assignment error:", error);
      throw error;
    }
  }

  /**
   * Professional job status management with automatic workflows
   */
  static async updateJobStatus(request: JobStatusUpdateRequest) {
    try {
      const { data, error } = await supabase.functions.invoke(
        "job-status-manager",
        {
          body: request,
        },
      );

      if (error) {
        throw new Error(error.message || "Failed to update job status");
      }

      return data;
    } catch (error) {
      console.error("Job status update error:", error);
      throw error;
    }
  }

  /**
   * Send comprehensive notifications to relevant parties
   */
  static async sendNotification(request: NotificationRequest) {
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-job-notification",
        {
          body: request,
        },
      );

      if (error) {
        throw new Error(error.message || "Failed to send notification");
      }

      return data;
    } catch (error) {
      console.error("Notification error:", error);
      throw error;
    }
  }

  /**
   * Get job analytics and performance metrics (placeholder for future analytics table)
   */
  static async getJobAnalytics(
    dealerId: string,
    dateRange?: { start: string; end: string },
  ) {
    try {
      // For now, return basic job stats from existing tables
      let query = supabase
        .from("jobs")
        .select(
          `
          *,
          assignments(
            id,
            driver_id,
            accepted_at,
            started_at,
            ended_at
          )
        `,
        )
        .eq("dealer_id", dealerId);

      if (dateRange) {
        query = query
          .gte("created_at", dateRange.start)
          .lte("created_at", dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Analytics fetch error:", error);
      throw error;
    }
  }

  /**
   * Get driver performance metrics (basic version using existing data)
   */
  static async getDriverPerformance(driverId?: string) {
    try {
      let query = supabase.from("drivers").select(`
          *,
          assignments:assignments!driver_id(
            id,
            jobs!job_id(
              id,
              status,
              distance_miles
            )
          )
        `);

      if (driverId) {
        query = query.eq("id", driverId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Driver performance fetch error:", error);
      throw error;
    }
  }

  /**
   * Enhanced job creation with automatic workflow setup
   */
  static async createProfessionalJob(jobData: any) {
    try {
      // Create the job
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert(jobData)
        .select()
        .single();

      if (jobError) {
        throw jobError;
      }

      // Analytics tracking would go here when analytics table is available
      console.log("Job created with professional workflow:", {
        jobId: job.id,
        dealerId: job.dealer_id,
        distance: job.distance_miles,
      });

      // Auto-assign if dealer preference is set to auto
      if (jobData.auto_assign) {
        setTimeout(async () => {
          try {
            await this.assignJob({
              jobId: job.id,
              dealerPreference: "auto",
            });
          } catch (error) {
            console.error("Auto-assignment failed:", error);
          }
        }, 1000); // 1 second delay to allow job to be fully created
      }

      return job;
    } catch (error) {
      console.error("Professional job creation error:", error);
      throw error;
    }
  }

  /**
   * Real-time job monitoring setup
   */
  static setupJobMonitoring(jobId: string, callback: (update: any) => void) {
    const channel = supabase
      .channel(`professional-job-monitoring-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          callback({
            type: "job_update",
            data: payload.new,
            old: payload.old,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          callback({
            type: "assignment_update",
            event: payload.eventType,
            data: payload.new,
            old: payload.old,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_messages",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          callback({
            type: "new_message",
            data: payload.new,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
