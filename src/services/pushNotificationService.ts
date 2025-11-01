import { supabase } from "@/integrations/supabase/client";

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId?: string;
  userType?: "driver" | "dealer";
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidKey =
    "BKxKMNz7kK5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K4K5K"; // Replace with real VAPID key

  async initialize() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered");
      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  async subscribe(userId: string): Promise<string | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey),
      });

      // Store subscription in database
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      return JSON.stringify(subscription);
    } catch (error) {
      console.error("Push subscription failed:", error);
      return null;
    }
  }

  async unsubscribe(userId: string): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription =
        await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);

      return true;
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
      return false;
    }
  }

  async sendNotification(payload: PushNotificationPayload): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke(
        "send-push-notification",
        {
          body: payload,
        },
      );

      if (error) {
        console.error("Push notification error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Push notification failed:", error);
      return false;
    }
  }

  // Send job-specific notifications
  async notifyNewJob(jobData: any, targetDrivers?: string[]) {
    const payload: PushNotificationPayload = {
      title: "New Job Available! 🚗",
      body: `${jobData.year || ""} ${jobData.make || ""} ${jobData.model || ""} - ${jobData.distance_miles || 0} miles`,
      data: {
        type: "new_job",
        jobId: jobData.id,
        url: "/driver/jobs",
      },
      userType: "driver",
    };

    return this.sendNotification(payload);
  }

  async notifyJobAssigned(jobData: any, driverId: string) {
    const payload: PushNotificationPayload = {
      title: "Job Assigned! 📋",
      body: `You've been assigned to deliver ${jobData.year} ${jobData.make} ${jobData.model}`,
      data: {
        type: "job_assigned",
        jobId: jobData.id,
        url: `/driver/jobs/${jobData.id}`,
      },
      userId: driverId,
    };

    return this.sendNotification(payload);
  }

  async notifyJobStatusUpdate(jobData: any, dealerId: string, status: string) {
    const statusMessages = {
      assigned: "Driver assigned to your job",
      in_progress: "Driver started the delivery",
      completed: "Job completed successfully",
      cancelled: "Job was cancelled",
    };

    const payload: PushNotificationPayload = {
      title: "Job Update 📱",
      body:
        statusMessages[status as keyof typeof statusMessages] ||
        "Job status updated",
      data: {
        type: "job_status_update",
        jobId: jobData.id,
        status,
        url: `/dealer/jobs/${jobData.id}`,
      },
      userId: dealerId,
    };

    return this.sendNotification(payload);
  }

  async notifyNewMessage(
    senderId: string,
    receiverId: string,
    message: string,
    jobId: string,
  ) {
    const payload: PushNotificationPayload = {
      title: "New Message 💬",
      body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      data: {
        type: "new_message",
        senderId,
        jobId,
        url: `/chat/${jobId}`,
      },
      userId: receiverId,
    };

    return this.sendNotification(payload);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
