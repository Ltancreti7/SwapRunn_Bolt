import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to Supabase realtime job updates for dealers or drivers.
 * Returns the latest payload so components can react to new data.
 */
export function useJobNotifications(dealerId, driverId) {
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    const channel = supabase
      .channel("jobs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        (payload) => {
          const jobRecord = payload.new ?? payload.old;

          if (dealerId && jobRecord?.dealer_id !== dealerId) {
            return;
          }

          if (driverId && jobRecord?.driver_id !== driverId) {
            return;
          }

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const message =
              payload.eventType === "INSERT"
                ? `New job created for ${jobRecord?.customer_name ?? "a customer"}.`
                : `Job for ${jobRecord?.customer_name ?? "a customer"} updated to ${jobRecord?.status ?? "new status"}.`;

            if (typeof window !== "undefined" && typeof window.alert === "function") {
              window.alert(message);
            } else {
              console.log(message);
            }
          }

          setLastEvent({
            type: payload.eventType,
            job: jobRecord,
            payload,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealerId, driverId]);

  return lastEvent;
}

export default useJobNotifications;
