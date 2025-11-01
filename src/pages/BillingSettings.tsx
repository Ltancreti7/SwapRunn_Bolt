import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SiteHeader from "@/components/SiteHeader";

interface SubscriptionData {
  plan_name: string;
  base_price_cents: number;
  per_swap_price_cents: number;
  swaps_this_period: number;
  billing_status: string;
  billing_period_start: string;
  billing_period_end: string;
  add_ons: {
    gps_tracking: boolean;
    signature_capture: boolean;
  };
  stripe_subscription_id: string | null;
}

export default function BillingSettings() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [addOns, setAddOns] = useState({
    gps_tracking: false,
    signature_capture: false,
  });
  const [updatingAddOns, setUpdatingAddOns] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!userProfile?.dealer_id) return;

    try {
      // Mock subscription data since dealer_subscriptions table doesn't exist yet
      const mockSubscription: SubscriptionData = {
        plan_name: "Professional",
        base_price_cents: 9900,
        per_swap_price_cents: 500,
        swaps_this_period: 0,
        billing_status: "active",
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        add_ons: { gps_tracking: false, signature_capture: false },
        stripe_subscription_id: "mock_sub_123",
      };

      setSubscription(mockSubscription);
      setAddOns(mockSubscription.add_ons);
    } catch (error) {
      logger.error("Error fetching subscription:", error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userProfile?.dealer_id, toast]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleSubscribe = async () => {
    if (!userProfile?.dealer_id) return;

    try {
      setLoading(true);
      const response = await supabase.functions.invoke("stripe-billing", {
        body: {
          dealerId: userProfile.dealer_id,
          addOns: addOns,
        },
      });

      if (response.error) throw response.error;

      const { checkoutUrl } = response.data;
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "Failed to start subscription",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleToggleAddOn = async (
    addonKey: "gps_tracking" | "signature_capture",
  ) => {
    if (!subscription) {
      toast({
        title: "No Active Subscription",
        description: "Please subscribe to a plan first",
        variant: "destructive",
      });
      return;
    }

    setUpdatingAddOns(true);
    const newAddOns = { ...addOns, [addonKey]: !addOns[addonKey] };
    setAddOns(newAddOns);

    try {
      // Mock update since dealer_subscriptions table doesn't exist yet
      setSubscription({
        ...subscription,
        add_ons: newAddOns,
      });

      toast({
        title: "Add-on Updated",
        description: `${addonKey.replace("_", " ")} has been ${newAddOns[addonKey] ? "enabled" : "disabled"}`,
      });

      fetchSubscription();
    } catch (error) {
      console.error("Error updating add-on:", error);
      toast({
        title: "Error",
        description: "Failed to update add-on",
        variant: "destructive",
      });
      setAddOns({ ...addOns });
    } finally {
      setUpdatingAddOns(false);
    }
  };

  const estimatedMonthlyBill = subscription
    ? subscription.base_price_cents +
      subscription.swaps_this_period * subscription.per_swap_price_cents +
      (addOns.gps_tracking ? 2900 : 0) +
      (addOns.signature_capture ? 1900 : 0)
    : 0;

  const usagePercentage = subscription
    ? (subscription.swaps_this_period / 60) * 100
    : 0;
  const showWarning = usagePercentage >= 90;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-24 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your SwapRunn subscription and usage
          </p>
        </div>

        {showWarning && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Your swap volume has exceeded 90% of expected usage. Consider
              reviewing your usage patterns.
            </AlertDescription>
          </Alert>
        )}

        {subscription?.billing_status === "past_due" && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your account is past due. Please update your payment method to
              continue using SwapRunn.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your active subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold text-primary">
                        Hybrid Plan
                      </div>
                      {subscription.stripe_subscription_id?.startsWith(
                        "test_",
                      ) && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full border border-yellow-500/30">
                          Test Mode
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      $99/month + $1.50 per swap
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {subscription.billing_status === "active" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600 capitalize">
                          {subscription.billing_status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    No active subscription
                  </p>
                  <Button onClick={handleSubscribe} className="w-full">
                    Subscribe Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage This Period
              </CardTitle>
              <CardDescription>
                {subscription
                  ? `${new Date(subscription.billing_period_start).toLocaleDateString()} - ${new Date(subscription.billing_period_end).toLocaleDateString()}`
                  : "No active billing period"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">
                      {subscription.swaps_this_period}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completed Swaps
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage Fee</span>
                      <span className="font-medium">
                        $
                        {(
                          (subscription.swaps_this_period *
                            subscription.per_swap_price_cents) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          showWarning ? "bg-yellow-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Subscribe to track usage
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Estimated Monthly Bill</CardTitle>
            <CardDescription>
              Based on current usage and add-ons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">
                    Base Subscription
                  </span>
                  <span className="font-medium">
                    ${(subscription.base_price_cents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">
                    Usage Fee ({subscription.swaps_this_period} swaps @ $1.50)
                  </span>
                  <span className="font-medium">
                    $
                    {(
                      (subscription.swaps_this_period *
                        subscription.per_swap_price_cents) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
                {addOns.gps_tracking && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">GPS Tracking</span>
                    <span className="font-medium">$29.00</span>
                  </div>
                )}
                {addOns.signature_capture && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">
                      Signature Capture
                    </span>
                    <span className="font-medium">$19.00</span>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between items-start">
                  <span className="text-lg font-semibold">Estimated Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(estimatedMonthlyBill / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No active subscription</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add-Ons</CardTitle>
            <CardDescription>
              Enhance your SwapRunn experience with optional features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="gps-tracking" className="text-base font-medium">
                  GPS Tracking
                </Label>
                <p className="text-sm text-muted-foreground">
                  Real-time vehicle location tracking - $29/month
                </p>
              </div>
              <Switch
                id="gps-tracking"
                checked={addOns.gps_tracking}
                onCheckedChange={() => handleToggleAddOn("gps_tracking")}
                disabled={updatingAddOns || !subscription}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="signature-capture"
                  className="text-base font-medium"
                >
                  Signature Capture
                </Label>
                <p className="text-sm text-muted-foreground">
                  Digital signature collection for deliveries - $19/month
                </p>
              </div>
              <Switch
                id="signature-capture"
                checked={addOns.signature_capture}
                onCheckedChange={() => handleToggleAddOn("signature_capture")}
                disabled={updatingAddOns || !subscription}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
