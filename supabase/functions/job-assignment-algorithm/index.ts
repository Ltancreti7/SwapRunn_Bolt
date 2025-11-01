import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssignmentRequest {
  jobId: string;
  driverId?: string; // Optional for auto-assignment
  dealerPreference?: "auto" | "manual";
}

interface DriverScore {
  driverId: string;
  score: number;
  distance?: number;
  rating: number;
  completionRate: number;
  availability: boolean;
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
      driverId,
      dealerPreference = "auto",
    }: AssignmentRequest = await req.json();

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if job is already assigned
    const { data: existingAssignment } = await supabase
      .from("assignments")
      .select("driver_id")
      .eq("job_id", jobId)
      .maybeSingle();

    if (existingAssignment) {
      return new Response(
        JSON.stringify({
          error: "Job already assigned",
          assignedTo: existingAssignment.driver_id,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let assignedDriverId = driverId;

    // Auto-assignment logic
    if (!driverId && dealerPreference === "auto") {
      // Get available drivers with performance metrics
      const { data: drivers, error: driversError } = await supabase
        .from("drivers")
        .select(
          `
          id, name, rating_avg, rating_count, available,
          max_miles, city_ok
        `,
        )
        .eq("available", true)
        .eq("checkr_status", "approved");

      if (driversError || !drivers?.length) {
        return new Response(
          JSON.stringify({ error: "No available drivers found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Calculate driver scores
      const driverScores: DriverScore[] = [];

      for (const driver of drivers) {
        // Get driver performance stats
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id, jobs!inner(status)")
          .eq("driver_id", driver.id);

        const totalJobs = assignments?.length || 0;
        const completedJobs =
          assignments?.filter((a: any) => a.jobs?.status === "completed")
            .length || 0;
        const completionRate = totalJobs > 0 ? completedJobs / totalJobs : 0;

        // Distance check (simplified - in production would use Google Maps API)
        const withinRange = job.distance_miles <= (driver.max_miles || 50);

        if (withinRange) {
          // Scoring algorithm
          const ratingScore = (driver.rating_avg || 5.0) / 5.0; // 0-1
          const completionScore = completionRate; // 0-1
          const experienceScore = Math.min(totalJobs / 10, 1); // 0-1, max at 10 jobs

          const totalScore =
            ratingScore * 0.4 + completionScore * 0.4 + experienceScore * 0.2;

          driverScores.push({
            driverId: driver.id,
            score: totalScore,
            rating: driver.rating_avg || 5.0,
            completionRate,
            availability: true,
          });
        }
      }

      if (driverScores.length === 0) {
        return new Response(
          JSON.stringify({
            error: "No qualified drivers available for this job",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Sort by score and select best driver
      driverScores.sort((a, b) => b.score - a.score);
      assignedDriverId = driverScores[0].driverId;

      console.log("Auto-assignment algorithm selected driver:", {
        driverId: assignedDriverId,
        score: driverScores[0].score,
        totalCandidates: driverScores.length,
      });
    }

    if (!assignedDriverId) {
      return new Response(
        JSON.stringify({
          error: "No driver specified and auto-assignment failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .insert({
        job_id: jobId,
        driver_id: assignedDriverId,
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (assignmentError) {
      console.error("Assignment creation error:", assignmentError);
      return new Response(
        JSON.stringify({
          error: "Failed to create assignment",
          details: assignmentError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update job status
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({ status: "assigned" })
      .eq("id", jobId);

    if (jobUpdateError) {
      console.error("Job status update error:", jobUpdateError);
      // Rollback assignment if job update fails
      await supabase.from("assignments").delete().eq("id", assignment.id);

      return new Response(
        JSON.stringify({ error: "Failed to update job status" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Send notification to driver
    if (Deno.env.get("RESEND_API_KEY")) {
      // Background notification - don't block response
      supabase.functions
        .invoke("send-job-notification", {
          body: {
            driverId: assignedDriverId,
            jobId: jobId,
            notificationType: "assignment",
          },
        })
        .catch(console.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignment,
        jobId,
        driverId: assignedDriverId,
        method: driverId ? "manual" : "auto",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Job assignment error:", error);
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
