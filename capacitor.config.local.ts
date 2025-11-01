import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.swaprunn.app",
  appName: "SwapRunn",
  webDir: "dist",
  server: {
    url: "https://8d6c882b-4c9b-4fef-b7b8-ef9a044dc4f6.lovableproject.com?forceHideBadge=true&v=20251001-5",
    cleartext: true,
    allowNavigation: [
      "8d6c882b-4c9b-4fef-b7b8-ef9a044dc4f6.lovableproject.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#E11900",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "default",
      backgroundColor: "#ffffff",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    NativeBiometric: {
      // Face ID / Touch ID configuration
    },
    Camera: {
      // Camera permissions
    },
    BarcodeScanner: {
      // Barcode scanner configuration
    },
  },
};

export default config;
