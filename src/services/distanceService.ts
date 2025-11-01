import { supabase } from "@/integrations/supabase/client";

interface DistanceResult {
  distance: number; // in miles
  duration: string; // human readable duration
  success: boolean;
  error?: string;
}

const MCGEE_TOYOTA_ADDRESS = "168 Charlestown Rd, Claremont, NH 03743";

export class DistanceService {
  async calculateDistance(
    pickupAddress: string = MCGEE_TOYOTA_ADDRESS,
    deliveryAddress: string,
  ): Promise<DistanceResult> {
    try {
      if (!deliveryAddress.trim()) {
        return {
          distance: 25, // default fallback
          duration: "1 hour",
          success: false,
          error: "Delivery address is required",
        };
      }

      // Call Supabase edge function for Google Maps integration
      const { data, error } = await supabase.functions.invoke(
        "calculate-distance",
        {
          body: {
            pickup_address: pickupAddress,
            delivery_address: deliveryAddress,
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        // Fall back to estimation if API fails
        const estimatedDistance = this.estimateDistance(
          pickupAddress,
          deliveryAddress,
        );
        return {
          distance: estimatedDistance,
          duration: this.estimateDuration(estimatedDistance),
          success: false,
          error: "Using estimated distance due to service error",
        };
      }

      return data as DistanceResult;
    } catch (error) {
      console.error("Distance calculation error:", error);
      // Fall back to estimation on any error
      const estimatedDistance = this.estimateDistance(
        pickupAddress,
        deliveryAddress,
      );
      return {
        distance: estimatedDistance,
        duration: this.estimateDuration(estimatedDistance),
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private estimateDistance(pickup: string, delivery: string): number {
    // Simple estimation based on address patterns
    // This is a placeholder until Google Maps API integration
    const deliveryLower = delivery.toLowerCase();

    // Check for nearby locations
    if (deliveryLower.includes("claremont") || deliveryLower.includes("nh")) {
      return Math.round(5 + Math.random() * 15); // 5-20 miles for local
    }

    if (deliveryLower.includes("vt") || deliveryLower.includes("vermont")) {
      return Math.round(20 + Math.random() * 40); // 20-60 miles for Vermont
    }

    if (
      deliveryLower.includes("ma") ||
      deliveryLower.includes("massachusetts")
    ) {
      return Math.round(40 + Math.random() * 80); // 40-120 miles for Mass
    }

    // Default estimate
    return Math.round(25 + Math.random() * 50); // 25-75 miles
  }

  private estimateDuration(miles: number): string {
    const hours = Math.round((miles / 35) * 10) / 10; // Assume 35 mph average
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
}

export const distanceService = new DistanceService();
