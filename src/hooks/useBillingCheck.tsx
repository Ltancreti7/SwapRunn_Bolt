import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface BillingStatus {
  canCreateJobs: boolean;
  billingStatus: string;
  showWarning: boolean;
  warningMessage?: string;
}

export function useBillingCheck() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [billingStatus, setBillingStatus] = useState<BillingStatus>({
    canCreateJobs: true,
    billingStatus: "active",
    showWarning: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBillingStatus();
  }, [userProfile]);

  const checkBillingStatus = async () => {
    if (!userProfile?.dealer_id) {
      setLoading(false);
      return;
    }

    try {
      const { data: subscription, error } = await supabase
        .from("dealer_subscriptions")
        .select("*")
        .eq("dealer_id", userProfile.dealer_id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (!subscription) {
        setBillingStatus({
          canCreateJobs: false,
          billingStatus: "no_subscription",
          showWarning: true,
          warningMessage:
            "No active subscription. Please subscribe to create jobs.",
        });
        setLoading(false);
        return;
      }

      const isPastDue = subscription.billing_status === "past_due";
      const usagePercentage = (subscription.swaps_this_period / 60) * 100;
      const highUsage = usagePercentage >= 90;

      setBillingStatus({
        canCreateJobs: !isPastDue,
        billingStatus: subscription.billing_status,
        showWarning: isPastDue || highUsage,
        warningMessage: isPastDue
          ? "Your account is past due. Please update payment to continue."
          : highUsage
            ? `You've used ${subscription.swaps_this_period} swaps this period (${usagePercentage.toFixed(0)}% of expected usage).`
            : undefined,
      });
    } catch (error) {
      console.error("Error checking billing status:", error);
      setBillingStatus({
        canCreateJobs: true,
        billingStatus: "unknown",
        showWarning: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkBeforeJobCompletion = async (): Promise<boolean> => {
    if (!userProfile?.dealer_id) return false;

    try {
      const { data: subscription } = await supabase
        .from("dealer_subscriptions")
        .select("billing_status")
        .eq("dealer_id", userProfile.dealer_id)
        .single();

      if (subscription?.billing_status === "past_due") {
        toast({
          title: "Payment Required",
          description:
            "Cannot complete jobs with past due account. Please update payment.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking billing before job completion:", error);
      return true; // Allow in case of error to prevent blocking
    }
  };

  return {
    billingStatus,
    loading,
    checkBillingStatus,
    checkBeforeJobCompletion,
  };
}
