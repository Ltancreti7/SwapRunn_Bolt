import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "@/services/notificationService";
import { smsService } from "@/services/smsService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useDriverNotifications = () => {
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [latestJob, setLatestJob] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  // Fetch count of unseen jobs since last_seen_jobs_at
  const fetchUnseenJobsCount = async () => {
    if (userProfile?.user_type !== "driver" || !userProfile.driver_id) return;

    try {
      // Get driver's last_seen_jobs_at timestamp
      const { data: driverData } = await supabase
        .from("drivers")
        .select("last_seen_jobs_at")
        .eq("id", userProfile.driver_id)
        .single();

      if (!driverData) return;

      // Count open jobs created after last_seen_jobs_at
      const { count } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")
        .gt("created_at", driverData.last_seen_jobs_at || "1970-01-01");

      setNewJobsCount(count || 0);
    } catch (error) {
      console.error("Error fetching unseen jobs:", error);
    }
  };

  // Mark jobs as seen by updating last_seen_jobs_at
  const markJobsSeen = async () => {
    if (userProfile?.user_type !== "driver" || !userProfile.driver_id) return;

    try {
      await supabase
        .from("drivers")
        .update({ last_seen_jobs_at: new Date().toISOString() })
        .eq("id", userProfile.driver_id);

      setNewJobsCount(0);
    } catch (error) {
      console.error("Error marking jobs as seen:", error);
    }
  };

  useEffect(() => {
    if (userProfile?.user_type !== "driver") return;
    const dealerId = (userProfile as any)?.dealer_id;
    if (!dealerId) return;

    // Request notification permissions on mount
    notificationService.requestPermission();

    // Fetch initial unseen jobs count
    fetchUnseenJobsCount();

    // Set up real-time subscription to jobs table
    const channel = supabase
      .channel(`job-notifications-${dealerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
          // Filter to jobs for the same dealership; we'll check status in handler
          filter: `dealer_id=eq.${dealerId}` as any,
        },
        async (payload) => {
          console.log("New job detected:", payload.new);

          const newJob = payload.new;

          // Only react to open jobs
          if (newJob?.status && newJob.status !== "open") {
            return;
          }

          // Update state
          setNewJobsCount((prev) => prev + 1);
          setLatestJob(newJob);
          setShowAlert(true);

          // Show browser notification
          notificationService.showJobNotification(newJob);

          // Play sound
          notificationService.playNotificationSound();

          // Send SMS notification if driver has phone number
          if (userProfile?.driver_id) {
            try {
              const { data: driverData } = await supabase
                .from("drivers")
                .select("phone")
                .eq("id", userProfile.driver_id)
                .single();

              if (driverData?.phone) {
                await smsService.sendJobNotification({
                  to: driverData.phone,
                  job: {
                    year: newJob.year,
                    make: newJob.make,
                    model: newJob.model,
                    distance_miles: newJob.distance_miles,
                    estimated_pay_cents: newJob.estimated_pay_cents,
                  },
                });
              }
            } catch (error) {
              console.error("Error sending SMS notification:", error);
            }
          }

          // Trigger a custom event to refresh available jobs in driver dashboard
          window.dispatchEvent(
            new CustomEvent("newJobAvailable", { detail: newJob }),
          );

          // Don't show toast, will use modal instead
          // Modal is triggered via showAlert state
        },
      )
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile, toast]);

  const clearAlert = () => {
    setShowAlert(false);
  };

  const clearNewJobsCount = () => {
    setNewJobsCount(0);
  };

  return {
    newJobsCount,
    latestJob,
    showAlert,
    clearAlert,
    clearNewJobsCount,
    markJobsSeen,
    fetchUnseenJobsCount,
  };
};
