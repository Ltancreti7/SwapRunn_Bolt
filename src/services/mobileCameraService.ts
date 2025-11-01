import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

class MobileCameraService {
  private isNative = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async takePhoto(): Promise<string | null> {
    try {
      if (this.isNative) {
        // Request permissions before accessing camera
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          console.error("Camera permission denied");
          return null;
        }

        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });

        return image.webPath || null;
      } else {
        // Fallback to web file input
        return new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.capture = "environment";

          input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };

          input.click();
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      return null;
    }
  }

  async selectPhoto(): Promise<string | null> {
    try {
      if (this.isNative) {
        // Request permissions before accessing photos
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          console.error("Camera/Photos permission denied");
          return null;
        }

        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos,
        });

        return image.webPath || null;
      } else {
        // Fallback to web file input
        return new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";

          input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };

          input.click();
        });
      }
    } catch (error) {
      console.error("Error selecting photo:", error);
      return null;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (this.isNative) {
      try {
        const permissions = await Camera.requestPermissions({
          permissions: ["camera", "photos"],
        });
        console.log("Camera permission status:", permissions);
        return (
          permissions.camera === "granted" || permissions.photos === "granted"
        );
      } catch (error) {
        console.error("Error requesting camera permissions:", error);
        return false;
      }
    }
    return true; // Web doesn't need explicit permissions
  }
}

export const mobileCameraService = new MobileCameraService();
