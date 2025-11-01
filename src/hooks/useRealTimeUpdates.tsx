import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobUpdatesConfig {
  dealerId?: string;
  onJobUpdate: () => void;
}

export const useJobUpdates = ({ dealerId, onJobUpdate }: JobUpdatesConfig) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!dealerId) return;

    const channel = supabase
      .channel(`dealer-jobs-${dealerId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `dealer_id=eq.${dealerId}`,
        },
        (payload) => {
          console.log("Job updated:", payload);
          if (payload.new.status === "assigned") {
            toast({
              title: "Job Status Updated",
              description: "A driver has been assigned to this job.",
              duration: 4000,
            });
          }
          onJobUpdate();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assignments",
        },
        (payload) => {
          console.log("New assignment:", payload);
          toast({
            title: "New Assignment",
            description: "A driver has accepted a job request.",
            duration: 4000,
          });
          onJobUpdate();
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "CHANNEL_ERROR") {
          toast({
            title: "Connection Issue",
            description: "Real-time updates may be delayed. Refreshing...",
            variant: "destructive",
            duration: 3000,
          });
          // Attempt to refresh after delay
          setTimeout(() => {
            onJobUpdate();
          }, 2000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealerId, onJobUpdate, toast]);
};
