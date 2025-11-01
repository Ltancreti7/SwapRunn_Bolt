// Notification service for driver alerts
export class NotificationService {
  private hasPermission = false;

  constructor() {
    this.checkPermission();
  }

  private checkPermission() {
    if ("Notification" in window) {
      this.hasPermission = Notification.permission === "granted";
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.hasPermission = true;
      return true;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === "granted";
    return this.hasPermission;
  }

  showJobNotification(job: any) {
    if (!this.hasPermission) return;

    const title = "New Drive Request Available!";
    const body = `${job.year} ${job.make} ${job.model} - ${job.distance_miles || 0} miles`;
    const icon = "/logo.png";

    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: `job-${job.id}`,
      requireInteraction: true,
      data: { jobId: job.id },
    });

    notification.onclick = () => {
      window.focus();
      // Navigate to requests page
      window.location.href = "/driver/requests";
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }

  playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }
}

export const notificationService = new NotificationService();
