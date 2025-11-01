// @ts-expect-error Remote import resolved at runtime in Deno
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DistanceRequest {
  pickup_address: string;
  delivery_address: string;
}

interface DistanceResponse {
  distance: number; // in miles
  duration: string; // human readable duration
  success: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pickup_address, delivery_address }: DistanceRequest =
      await req.json();

    if (!pickup_address || !delivery_address) {
      return new Response(
        JSON.stringify({
          distance: 25,
          duration: "1 hour",
          success: false,
          error: "Both pickup and delivery addresses are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleMapsApiKey) {
      console.error("Google Maps API key not configured");
      return new Response(
        JSON.stringify({
          distance: 25,
          duration: "1 hour",
          success: false,
          error: "Distance calculation service temporarily unavailable",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Call Google Maps Routes API (newer, more reliable API)
    const routesUrl = `https://routes.googleapis.com/directions/v2:computeRoutes`;

    const routesResponse = await fetch(routesUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapsApiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          address: pickup_address,
        },
        destination: {
          address: delivery_address,
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        units: "IMPERIAL",
      }),
    });

    const routesData = await routesResponse.json();
    console.log("Google Maps Routes API response received", {
      ok: routesResponse.ok,
      status: routesResponse.status,
      hasRoutes:
        Array.isArray(routesData?.routes) && routesData.routes.length > 0,
    });

    if (
      !routesResponse.ok ||
      !routesData.routes ||
      routesData.routes.length === 0
    ) {
      const apiError = routesData?.error || routesData?.error_message;
      console.error("Google Maps Routes API error", {
        status: routesResponse.status,
        message: typeof apiError === "string" ? apiError : undefined,
      });
      return new Response(
        JSON.stringify({
          distance: 25,
          duration: "1 hour",
          success: false,
          error: "Unable to calculate distance for provided addresses",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const route = routesData.routes[0];

    // Extract distance in miles and duration
    const distanceInMeters = route.distanceMeters;
    const distanceInMiles =
      Math.round(distanceInMeters * 0.000621371 * 10) / 10; // Convert to miles and round to 1 decimal

    // Convert duration to human readable format
    const durationSeconds = parseInt(route.duration.replace("s", ""));
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const durationText =
      hours > 0
        ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} min${minutes !== 1 ? "s" : ""}`
        : `${minutes} min${minutes !== 1 ? "s" : ""}`;

    const result: DistanceResponse = {
      distance: distanceInMiles,
      duration: durationText,
      success: true,
    };

    console.log("Distance calculation result", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in calculate-distance function", { message });
    return new Response(
      JSON.stringify({
        distance: 25,
        duration: "1 hour",
        success: false,
        error: "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
