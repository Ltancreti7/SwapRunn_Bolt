import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-expect-error Remote import available at runtime in Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId?: string;
  userType?: "driver" | "dealer";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { title, body, data, userId, userType }: PushNotificationRequest =
      await req.json();

    console.log("Processing push notification:", {
      title,
      body,
      userId,
      userType,
    });

    // Get push subscriptions based on criteria
    let query = supabaseClient.from("push_subscriptions").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (userType) {
      // Get users of specific type through profiles
      const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("user_id")
        .eq("user_type", userType);

      if (profiles && profiles.length > 0) {
        const userIds = profiles.map((p) => p.user_id);
        query = query.in("user_id", userIds);
      }
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found");
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          message: "No subscriptions found",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Send push notifications to each subscription
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        const subscription = JSON.parse(sub.subscription);

        const payload = JSON.stringify({
          title,
          body,
          data: {
            ...data,
            timestamp: new Date().toISOString(),
          },
        });

        // Use Web Push API (you'll need to implement proper VAPID key handling)
        const response = await fetch(subscription.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            TTL: "86400",
            // Add VAPID authorization headers here
          },
          body: payload,
        });

        if (!response.ok) {
          console.error("Push failed for subscription", {
            subscriptionId: sub.id,
            status: response.status,
          });

          // Remove invalid subscriptions
          if (response.status === 410) {
            await supabaseClient
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }

          return false;
        }

        return true;
      } catch (error) {
        console.error("Error sending push to subscription", {
          subscriptionId: sub.id,
          message: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(Boolean).length;

    console.log(
      `Push notifications sent: ${successCount}/${subscriptions.length}`,
    );

    // Log notification for analytics
    await supabaseClient.from("notification_logs").insert({
      title,
      body,
      user_id: userId,
      user_type: userType,
      type: "push",
      sent_count: successCount,
      total_count: subscriptions.length,
      success: successCount > 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: subscriptions.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error in send-push-notification function", {
      message: error?.message ?? String(error),
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
