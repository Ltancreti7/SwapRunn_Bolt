import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-expect-error Remote import available at runtime in Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let assignmentId: string | null = null;

  try {
    const body = await req.json();
    assignmentId = body?.assignment_id ?? null;

    if (!assignmentId) {
      return new Response("Missing assignment_id", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get assignment and timesheet data
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select(
        `
        *,
        driver:drivers(*),
        job:jobs(*),
        timesheet:timesheets(*)
      `,
      )
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error("Assignment not found", {
        assignmentId,
        message: assignmentError?.message,
      });
      return new Response("Assignment not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    const timesheet = assignment.timesheet?.[0];
    if (!timesheet) {
      return new Response("No timesheet found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Calculate payout amount
    const hoursWorked = Math.ceil(timesheet.total_seconds / 3600);
    const amountCents = hoursWorked * timesheet.pay_rate_cents;

    if (!stripeSecretKey || !assignment.driver?.stripe_connect_id) {
      console.log(
        "TEST MODE: Would pay",
        amountCents / 100,
        "dollars to driver",
        assignment.driver?.name,
      );

      // Create payout record in TEST MODE
      const { error: payoutError } = await supabase.from("payouts").insert({
        assignment_id: assignmentId,
        driver_id: assignment.driver_id,
        amount_cents: amountCents,
        status: "pending",
      });

      if (payoutError) {
        console.error("Error creating payout record", {
          assignmentId,
          message: payoutError.message,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          testMode: true,
          amount: amountCents / 100,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Real Stripe transfer
    const transferResponse = await fetch(
      "https://api.stripe.com/v1/transfers",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          amount: amountCents.toString(),
          currency: "usd",
          destination: assignment.driver.stripe_connect_id,
        }),
      },
    );

    const transfer = await transferResponse.json();

    if (transferResponse.ok) {
      // Create successful payout record
      const { error: payoutError } = await supabase.from("payouts").insert({
        assignment_id: assignmentId,
        driver_id: assignment.driver_id,
        amount_cents: amountCents,
        stripe_transfer_id: transfer.id,
        status: "paid",
      });

      if (payoutError) {
        console.error("Error creating payout record", {
          assignmentId,
          message: payoutError.message,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          transfer_id: transfer.id,
          amount: amountCents / 100,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else {
      console.error("Stripe transfer failed", {
        assignmentId,
        driverId: assignment.driver_id,
        status: transferResponse.status,
        message:
          transfer?.error?.message ?? transfer?.message ?? "Unknown error",
      });

      // Create failed payout record
      const { error: payoutError } = await supabase.from("payouts").insert({
        assignment_id: assignmentId,
        driver_id: assignment.driver_id,
        amount_cents: amountCents,
        status: "failed",
      });

      if (payoutError) {
        console.error("Error creating payout record", {
          assignmentId,
          message: payoutError.message,
        });
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: transfer.error?.message || "Transfer failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Payout error", {
      assignmentId,
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
