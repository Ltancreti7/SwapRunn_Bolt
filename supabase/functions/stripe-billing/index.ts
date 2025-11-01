import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

// Hybrid billing model: $99/month base + $1.50 per swap
const HYBRID_PLAN = {
  basePriceId: "price_hybrid_base", // Monthly subscription
  meteredPriceId: "price_hybrid_metered", // Per-swap usage
  basePrice: 9900, // $99/month
  perSwapPrice: 150, // $1.50 per swap
};

const ADD_ONS = {
  gps_tracking: { priceId: "price_addon_gps", price: 2900 }, // $29/mo
  signature_capture: { priceId: "price_addon_signature", price: 1900 }, // $19/mo
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealerId, addOns = {}, testMode = false } = await req.json();

    if (!stripeSecretKey || testMode) {
      console.log("TEST MODE: Creating test subscription");

      // Create mock subscription record with hybrid billing
      const { error } = await supabase.from("dealer_subscriptions").upsert({
        dealer_id: dealerId,
        plan_name: "hybrid",
        base_price_cents: HYBRID_PLAN.basePrice,
        per_swap_price_cents: HYBRID_PLAN.perSwapPrice,
        swaps_this_period: 0,
        billing_status: "active",
        status: "active",
        add_ons: addOns,
        stripe_subscription_id: `test_sub_hybrid_${Date.now()}`,
        monthly_runs_limit: 99999,
        price_cents: HYBRID_PLAN.basePrice,
      });

      if (error) {
        console.error("Error creating test subscription:", error);
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "TEST MODE: Hybrid subscription activated",
          checkoutUrl: "/dealer/settings?tab=billing&success=true",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Real Stripe integration with hybrid billing
    // Build line items: base subscription + add-ons
    const lineItems: Record<string, string> = {
      "line_items[0][price]": HYBRID_PLAN.basePriceId,
      "line_items[0][quantity]": "1",
    };

    // Add metered billing for swaps
    lineItems["line_items[1][price]"] = HYBRID_PLAN.meteredPriceId;

    let itemIndex = 2;
    // Add optional add-ons
    for (const [addonKey, enabled] of Object.entries(addOns)) {
      if (enabled && ADD_ONS[addonKey as keyof typeof ADD_ONS]) {
        const addon = ADD_ONS[addonKey as keyof typeof ADD_ONS];
        lineItems[`line_items[${itemIndex}][price]`] = addon.priceId;
        lineItems[`line_items[${itemIndex}][quantity]`] = "1";
        itemIndex++;
      }
    }

    // Create Stripe Checkout session
    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          mode: "subscription",
          ...lineItems,
          success_url: `${req.headers.get("origin")}/dealer/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.get("origin")}/dealer/settings?tab=billing&canceled=true`,
          "metadata[dealer_id]": dealerId,
          "metadata[plan_name]": "hybrid",
          "metadata[add_ons]": JSON.stringify(addOns),
        }),
      },
    );

    if (!stripeResponse.ok) {
      throw new Error(`Stripe API error: ${stripeResponse.status}`);
    }

    const session = await stripeResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Billing error:", error);
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
