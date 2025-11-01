import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionLimits {
  canCreateJob: boolean;
  currentUsage: number;
  monthlyLimit: number;
  planName: string;
  upgradeRequired: boolean;
}

class SubscriptionService {
  async checkSubscriptionLimits(dealerId: string): Promise<SubscriptionLimits> {
    try {
      // Get dealer subscription
      const { data: subscription, error } = await supabase
        .from("dealer_subscriptions")
        .select("*")
        .eq("dealer_id", dealerId)
        .eq("status", "active")
        .single();

      if (error || !subscription) {
        // Default to starter plan if no subscription found
        return {
          canCreateJob: false,
          currentUsage: 0,
          monthlyLimit: 20,
          planName: "starter",
          upgradeRequired: true,
        };
      }

      // Get current month's job count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .gte("created_at", startOfMonth.toISOString());

      const currentUsage = jobs?.length || 0;
      const monthlyLimit = subscription.monthly_runs_limit;
      const canCreateJob = monthlyLimit === -1 || currentUsage < monthlyLimit;

      return {
        canCreateJob,
        currentUsage,
        monthlyLimit,
        planName: subscription.plan_name,
        upgradeRequired: !canCreateJob && monthlyLimit !== -1,
      };
    } catch (error) {
      console.error("Error checking subscription limits:", error);
      return {
        canCreateJob: false,
        currentUsage: 0,
        monthlyLimit: 20,
        planName: "starter",
        upgradeRequired: true,
      };
    }
  }

  async incrementUsage(dealerId: string): Promise<void> {
    try {
      // First get current usage
      const { data: subscription, error: fetchError } = await supabase
        .from("dealer_subscriptions")
        .select("runs_used_this_month")
        .eq("dealer_id", dealerId)
        .eq("status", "active")
        .single();

      if (fetchError || !subscription) {
        console.error("Error fetching subscription:", fetchError);
        return;
      }

      // Increment usage
      const { error } = await supabase
        .from("dealer_subscriptions")
        .update({
          runs_used_this_month: (subscription.runs_used_this_month || 0) + 1,
        })
        .eq("dealer_id", dealerId)
        .eq("status", "active");

      if (error) {
        console.error("Error incrementing usage:", error);
      }
    } catch (error) {
      console.error("Error incrementing usage:", error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
