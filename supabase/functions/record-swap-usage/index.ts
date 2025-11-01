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

  try {
    // Get unbilled usage records
    const { data: usageRecords, error: fetchError } = await supabase
      .from("swap_usage_records")
      .select("*, dealer_subscriptions!inner(stripe_subscription_id)")
      .eq("billed", false);

    if (fetchError) throw fetchError;

    if (!usageRecords || usageRecords.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No unbilled usage to report",
          count: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Group by dealer and report to Stripe
    const dealerUsage = new Map<
      string,
      { subscriptionId: string; count: number; records: any[] }
    >();

    for (const record of usageRecords) {
      const dealerId = record.dealer_id;
      if (!dealerUsage.has(dealerId)) {
        dealerUsage.set(dealerId, {
          subscriptionId: record.dealer_subscriptions.stripe_subscription_id,
          count: 0,
          records: [],
        });
      }
      const usage = dealerUsage.get(dealerId)!;
      usage.count++;
      usage.records.push(record);
    }

    const results = [];

    for (const [dealerId, usage] of dealerUsage) {
      if (!stripeSecretKey || !usage.subscriptionId) {
        console.log(
          `Skipping Stripe reporting for dealer ${dealerId} (test mode or no subscription)`,
        );
        // Mark as billed anyway in test mode
        await supabase
          .from("swap_usage_records")
          .update({ billed: true })
          .in(
            "id",
            usage.records.map((r) => r.id),
          );
        continue;
      }

      // Get subscription items to find the metered price item
      const subResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${usage.subscriptionId}`,
        {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        },
      );

      const subscription = await subResponse.json();
      const meteredItem = subscription.items.data.find(
        (item: any) => item.price.recurring?.usage_type === "metered",
      );

      if (!meteredItem) {
        console.error(
          `No metered item found for subscription ${usage.subscriptionId}`,
        );
        continue;
      }

      // Report usage to Stripe
      const usageResponse = await fetch(
        `https://api.stripe.com/v1/subscription_items/${meteredItem.id}/usage_records`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            quantity: usage.count.toString(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            action: "increment",
          }),
        },
      );

      const usageRecord = await usageResponse.json();

      if (!usageResponse.ok) {
        console.error("Stripe usage recording failed", {
          dealerId,
          status: usageResponse.status,
          message:
            usageRecord?.error || usageRecord?.message || "Unknown error",
        });
        continue;
      }

      // Mark records as billed
      const { error: updateError } = await supabase
        .from("swap_usage_records")
        .update({
          billed: true,
          stripe_usage_record_id: usageRecord.id,
        })
        .in(
          "id",
          usage.records.map((r) => r.id),
        );

      if (updateError) {
        console.error("Failed to mark records as billed", {
          dealerId,
          message: updateError.message,
        });
      }

      results.push({
        dealerId,
        swapsReported: usage.count,
        stripeUsageRecordId: usageRecord.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalDealers: dealerUsage.size,
        totalSwaps: usageRecords.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Usage recording error", {
      message: error?.message ?? String(error),
    });
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
