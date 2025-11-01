import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const {
      full_name,
      phone,
      email,
      license_number,
      license_photo_url,
      insurance_url,
      government_id_url,
      dealership_code,
      dealer_id,
    } = await req.json();

    console.log("Received driver signup data:", {
      full_name,
      phone,
      email,
      license_number,
      dealership_code,
      dealer_id,
    });

    // Validate required fields
    if (!full_name || !phone || !email || !license_number) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: full_name, phone, email, license_number",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Resolve dealer_id from dealership_code if provided
    let resolvedDealerId = dealer_id;
    if (dealership_code && !resolvedDealerId) {
      const { data: dealer, error: dealerError } = await supabase
        .from("dealers")
        .select("id")
        .eq("dealership_code", dealership_code.toUpperCase())
        .single();

      if (dealerError || !dealer) {
        console.error("Invalid dealership code:", dealership_code);
        return new Response(
          JSON.stringify({
            error: "Invalid dealership code. Please contact your dealership for the correct code.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      resolvedDealerId = dealer.id;
      console.log("Resolved dealer_id from code:", resolvedDealerId);
    }

    // Insert driver data into the drivers table
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .insert({
        name: full_name,
        phone: phone,
        email: email,
        dealer_id: resolvedDealerId || null,
        checkr_status: "pending",
        available: true,
        city_ok: true,
        max_miles: 50,
        rating_avg: 5.0,
        rating_count: 0,
      })
      .select()
      .single();

    if (driverError) {
      console.error("Error inserting driver:", driverError);
      return new Response(
        JSON.stringify({
          error: "Failed to create driver profile",
          details: driverError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Driver created successfully:", driver);

    // Note: In a production app, you would also:
    // 1. Store license_number, license_photo_url, insurance_url, government_id_url in a separate documents table
    // 2. Trigger background checks via Checkr API
    // 3. Send confirmation emails
    // For now, we'll just return success

    return new Response(
      JSON.stringify({
        success: true,
        message: "Driver profile created successfully",
        driver_id: driver.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in driver_signup function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
