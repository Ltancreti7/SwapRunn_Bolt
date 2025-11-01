import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Webhook received");

    if (!webhookSecret) {
      console.log("TEST MODE: No webhook secret configured");
      return new Response("TEST MODE: Webhook processed", {
        status: 200,
        headers: corsHeaders,
      });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe signature found");
      return new Response("No signature", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // In production, verify the webhook signature here
    const event = JSON.parse(body);
    console.log("Processing event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout completed:", session.id);

        const dealerId = session.metadata?.dealer_id;
        const planName = session.metadata?.plan_name;
        const addOns = session.metadata?.add_ons
          ? JSON.parse(session.metadata.add_ons)
          : {};

        if (dealerId && planName) {
          // Update dealer subscription with hybrid billing
          const { error } = await supabase.from("dealer_subscriptions").upsert({
            dealer_id: dealerId,
            plan_name: "hybrid",
            base_price_cents: 9900,
            per_swap_price_cents: 150,
            swaps_this_period: 0,
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            billing_status: "active",
            status: "active",
            add_ons: addOns,
            billing_period_start: new Date(),
            billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

          if (error) console.error("Error updating subscription:", error);
        }

        // Also update dealer with subscription info
        const { error: dealerError } = await supabase
          .from("dealers")
          .update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: "active",
          })
          .eq("id", dealerId);

        if (dealerError) console.error("Error updating dealer:", dealerError);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        console.log("Invoice paid:", invoice.id);

        // Activate dealer subscription
        await supabase
          .from("dealer_subscriptions")
          .update({ billing_status: "active" })
          .eq("stripe_customer_id", invoice.customer);

        await supabase
          .from("dealers")
          .update({ status: "active" })
          .eq("stripe_customer_id", invoice.customer);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("Invoice payment failed:", invoice.id);

        // Mark subscription as past_due
        await supabase
          .from("dealer_subscriptions")
          .update({ billing_status: "past_due" })
          .eq("stripe_customer_id", invoice.customer);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response("Webhook processed", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
