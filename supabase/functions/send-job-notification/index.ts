import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
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
      driverId,
      dealerId,
      jobId,
      notificationType,
      customMessage,
    }: NotificationRequest = await req.json();

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(
        `
        *,
        dealers(*),
        assignments(
          id,
          driver_id,
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

    const notifications = [];

    // Prepare notification content based on type
    let subject = "";
    let message = "";

    switch (notificationType) {
      case "assignment":
        subject = `New Job Assignment - ${job.year} ${job.make} ${job.model}`;
        message = `You've been assigned a new delivery job for a ${job.year} ${job.make} ${job.model}. 
                  Distance: ${job.distance_miles} miles
                  Pickup: ${job.pickup_address}
                  Delivery: ${job.delivery_address}
                  Estimated Pay: $${(job.estimated_pay_cents / 100).toFixed(2)}`;
        break;

      case "status_update":
        subject = `Job Status Update - ${job.track_token}`;
        message =
          customMessage || `Your job status has been updated to: ${job.status}`;
        break;

      case "completion":
        subject = `Job Completed - ${job.track_token}`;
        message = `Great job! Your delivery has been completed successfully.`;
        break;

      case "cancellation":
        subject = `Job Cancelled - ${job.track_token}`;
        message = `The job has been cancelled. Please check the app for details.`;
        break;
    }

    // Send notification to driver if specified
    if (driverId) {
      const { data: driver } = await supabase
        .from("drivers")
        .select("name, email, phone")
        .eq("id", driverId)
        .single();

      if (driver) {
        // Check notification preferences
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", driverId)
          .single();

        const preferences = prefs || {
          email_notifications: true,
          sms_notifications: true,
          push_notifications: true,
          job_updates: true,
        };

        // Email notification placeholder (requires Resend setup)
        if (
          driver.email &&
          preferences.email_notifications &&
          preferences.job_updates
        ) {
          console.log(
            "Would send email to:",
            driver.email,
            "Subject:",
            subject,
          );
          notifications.push({
            type: "email",
            status: "skipped",
            reason: "Resend not configured",
          });
        }

        // SMS notification
        if (
          driver.phone &&
          preferences.sms_notifications &&
          preferences.job_updates
        ) {
          try {
            const smsResult = await supabase.functions.invoke("sms", {
              body: {
                to: driver.phone,
                body: `SwapRunn: ${subject}. ${message.substring(0, 100)}... Check app for details.`,
              },
            });
            notifications.push({
              type: "sms",
              status: "sent",
              result: smsResult,
            });
          } catch (smsError) {
            console.error("SMS notification error:", smsError);
            notifications.push({
              type: "sms",
              status: "failed",
              error:
                smsError instanceof Error ? smsError.message : "SMS failed",
            });
          }
        }
      }
    }

    // Send notification to dealer if specified
    if (dealerId) {
      const { data: dealer } = await supabase
        .from("dealers")
        .select("name, email")
        .eq("id", dealerId)
        .single();

      if (dealer?.email) {
        const dealerSubject = `Job Update - ${job.track_token}`;
        const dealerMessage = `Your job has been updated: ${job.status}`;

        console.log(
          "Would send email to dealer:",
          dealer.email,
          "Subject:",
          dealerSubject,
        );
        notifications.push({
          type: "dealer_email",
          status: "skipped",
          reason: "Resend not configured",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications,
        jobId,
        notificationType,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Notification error:", error);
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
