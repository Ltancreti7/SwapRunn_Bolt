import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.swaprunn.app",
  appName: "SwapRunn",
  webDir: "dist",
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
