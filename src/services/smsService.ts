import { supabase } from "@/integrations/supabase/client";

export interface SMSJobNotification {
  to: string;
  job: {
    year?: number;
    make?: string;
    model?: string;
    distance_miles?: number;
    estimated_pay_cents?: number;
  };
}

export const smsService = {
  async sendJobNotification({ to, job }: SMSJobNotification): Promise<boolean> {
    try {
      // Format the SMS message
      const vehicleInfo =
        `${job.year || ""} ${job.make || ""} ${job.model || ""}`.trim();
      const distance = job.distance_miles || 0;
      const payAmount = job.estimated_pay_cents
        ? (job.estimated_pay_cents / 100).toFixed(2)
        : "0.00";

      const message = `🚗 New SwapRunn Job Available! ${vehicleInfo} - ${distance} miles. Pay: $${payAmount}. Accept in app now!`;

      // Call the SMS edge function
      const { data, error } = await supabase.functions.invoke("sms", {
        body: {
          to: to,
          body: message,
        },
      });

      if (error) {
        console.error("SMS sending error:", error);
        return false;
      }

      console.log("SMS sent successfully:", data);
      return true;
    } catch (error) {
      console.error("SMS service error:", error);
      return false;
    }
  },
};
