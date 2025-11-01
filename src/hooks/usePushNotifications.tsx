import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { pushNotificationService } from "@/services/pushNotificationService";

interface UsePushNotificationsProps {
  userId?: string;
  userType?: "driver" | "dealer";
  enabled?: boolean;
}

export const usePushNotifications = ({
  userId,
  userType,
  enabled = true,
}: UsePushNotificationsProps = {}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, [userId]);

  const checkSubscriptionStatus = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .single();

      setIsSubscribed(!!data);
    } catch (error) {
      setIsSubscribed(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device",
        variant: "destructive",
      });
      return false;
    }

    const granted = await pushNotificationService.requestPermission();
    setPermission(Notification.permission);

    if (!granted) {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
    }

    return granted;
  };

  const subscribe = async (): Promise<boolean> => {
    if (!userId || !enabled) return false;

    setIsLoading(true);
    try {
      // Initialize service worker first
      await pushNotificationService.initialize();

      // Request permission if needed
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Subscribe to push notifications
      const subscription = await pushNotificationService.subscribe(userId);

      if (subscription) {
        setIsSubscribed(true);
        toast({
          title: "Notifications Enabled",
          description:
            "You'll now receive push notifications for new jobs and updates",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Push subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribe(userId);

      if (success) {
        setIsSubscribed(false);
        toast({
          title: "Notifications Disabled",
          description: "Push notifications have been turned off",
        });
      }

      return success;
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-subscribe for drivers when enabled
  useEffect(() => {
    if (
      enabled &&
      userId &&
      userType === "driver" &&
      isSupported &&
      permission === "granted" &&
      !isSubscribed
    ) {
      subscribe();
    }
  }, [enabled, userId, userType, isSupported, permission, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
  };
};
