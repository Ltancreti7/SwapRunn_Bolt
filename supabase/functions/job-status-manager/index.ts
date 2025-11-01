import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const {
      jobId,
      assignmentId,
      newStatus,
      userId,
      location,
      notes,
    }: StatusUpdateRequest = await req.json();

    // Get current job and assignment details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(
        `
        *,
        assignments(
          id,
          driver_id,
          accepted_at,
          started_at,
          ended_at,
          drivers(*)
        )
      `,
      )
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assignment = assignmentId
      ? job.assignments.find((a: any) => a.id === assignmentId)
      : job.assignments[0];

    if (!assignment) {
      return new Response(JSON.stringify({ error: "Assignment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user permission
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("user_type, dealer_id, driver_id")
      .eq("user_id", userId)
      .single();

    const canUpdate =
      (userProfile?.user_type === "dealer" &&
        userProfile.dealer_id === job.dealer_id) ||
      (userProfile?.user_type === "driver" &&
        userProfile.driver_id === assignment.driver_id);

    if (!canUpdate) {
      return new Response(
        JSON.stringify({ error: "Unauthorized to update this job" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date().toISOString();
    const updates: any = {};
    const assignmentUpdates: any = {};

    // Handle status-specific logic
    switch (newStatus) {
      case "in_progress":
        if (job.status !== "assigned") {
          return new Response(
            JSON.stringify({ error: "Job must be assigned before starting" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        assignmentUpdates.started_at = now;

        // Start timesheet
        const { error: timesheetError } = await supabase
          .from("timesheets")
          .update({ started_at: now })
          .eq("assignment_id", assignment.id);

        if (timesheetError) {
          console.error("Timesheet start error:", timesheetError);
        }
        break;

      case "completed":
        if (job.status !== "in_progress") {
          return new Response(
            JSON.stringify({
              error: "Job must be in progress before completing",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        assignmentUpdates.ended_at = now;

        // End timesheet and calculate total time
        if (assignment.started_at) {
          const startTime = new Date(assignment.started_at);
          const endTime = new Date(now);
          const totalSeconds = Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000,
          );

          const { error: timesheetEndError } = await supabase
            .from("timesheets")
            .update({
              ended_at: now,
              total_seconds: totalSeconds,
            })
            .eq("assignment_id", assignment.id);

          if (timesheetEndError) {
            console.error("Timesheet end error:", timesheetEndError);
          }
        }
        break;

      case "cancelled":
        // Can be cancelled from any state except completed
        if (job.status === "completed") {
          return new Response(
            JSON.stringify({ error: "Cannot cancel completed job" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        // End timesheet if in progress
        if (job.status === "in_progress" && assignment.started_at) {
          const startTime = new Date(assignment.started_at);
          const endTime = new Date(now);
          const totalSeconds = Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000,
          );

          await supabase
            .from("timesheets")
            .update({
              ended_at: now,
              total_seconds: totalSeconds,
            })
            .eq("assignment_id", assignment.id);
        }
        break;
    }

    // Update job status
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId);

    if (jobUpdateError) {
      return new Response(
        JSON.stringify({
          error: "Failed to update job status",
          details: jobUpdateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update assignment if needed
    if (Object.keys(assignmentUpdates).length > 0) {
      const { error: assignmentUpdateError } = await supabase
        .from("assignments")
        .update(assignmentUpdates)
        .eq("id", assignment.id);

      if (assignmentUpdateError) {
        console.error("Assignment update error:", assignmentUpdateError);
      }
    }

    // Add activity log
    const activityMessage = notes || `Job status changed to ${newStatus}`;
    if (job.dealer_id && assignment.driver_id) {
      await supabase.from("job_messages").insert({
        job_id: jobId,
        assignment_id: assignment.id,
        sender_id: userId,
        sender_type: userProfile?.user_type || "system",
        message: activityMessage,
        metadata: {
          status_change: {
            from: job.status,
            to: newStatus,
            location,
            timestamp: now,
          },
        },
      });
    }

    // Send notifications
    try {
      await supabase.functions.invoke("send-job-notification", {
        body: {
          driverId:
            userProfile?.user_type === "dealer"
              ? assignment.driver_id
              : undefined,
          dealerId:
            userProfile?.user_type === "driver" ? job.dealer_id : undefined,
          jobId,
          notificationType: "status_update",
          customMessage: `Job status updated to ${newStatus}${notes ? `: ${notes}` : ""}`,
        },
      });
    } catch (notificationError) {
      console.error("Notification error:", notificationError);
      // Don't fail the status update if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        oldStatus: job.status,
        newStatus,
        timestamp: now,
        assignment: {
          id: assignment.id,
          ...assignmentUpdates,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Job status update error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
