import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

class MobileGeolocationService {
  private isNative = false;
  private watchId: string | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    try {
      if (this.isNative) {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location !== "granted") {
          throw new Error("Location permission denied");
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } else {
        // Fallback to web geolocation
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => reject(error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            },
          );
        });
      }
    } catch (error) {
      console.error("Error getting current position:", error);
      return null;
    }
  }

  async startWatching(
    callback: (position: { latitude: number; longitude: number }) => void,
  ) {
    try {
      if (this.isNative) {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location !== "granted") {
          throw new Error("Location permission denied");
        }

        this.watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
          },
          (position) => {
            if (position) {
              callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            }
          },
        );
      } else {
        // Fallback to web geolocation
        if (navigator.geolocation) {
          const id = navigator.geolocation.watchPosition(
            (position) => {
              callback({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => console.error("Geolocation error:", error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            },
          );
          this.watchId = id.toString();
        }
      }
    } catch (error) {
      console.error("Error starting location watch:", error);
    }
  }

  async stopWatching() {
    if (this.watchId) {
      try {
        if (this.isNative) {
          await Geolocation.clearWatch({ id: this.watchId });
        } else {
          navigator.geolocation.clearWatch(parseInt(this.watchId));
        }
        this.watchId = null;
      } catch (error) {
        console.error("Error stopping location watch:", error);
      }
    }
  }
}

export const mobileGeolocationService = new MobileGeolocationService();
