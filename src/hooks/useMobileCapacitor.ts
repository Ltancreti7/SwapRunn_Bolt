import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const useMobileCapacitor = () => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const initializeCapacitor = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);

      if (native) {
        // Configure status bar
        try {
          await StatusBar.setStyle({ style: Style.Default });
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
        } catch (error) {
          console.log("StatusBar not available:", error);
        }

        // Hide splash screen
        try {
          await SplashScreen.hide();
        } catch (error) {
          console.log("SplashScreen not available:", error);
        }
      }
    };

    initializeCapacitor();
  }, []);

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.log("Haptics not available:", error);
      }
    }
  };

  return {
    isNative,
    triggerHaptic,
    platform: Capacitor.getPlatform(),
  };
};
