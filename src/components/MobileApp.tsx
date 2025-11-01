import { useEffect } from "react";
import { useMobileCapacitor } from "@/hooks/useMobileCapacitor";
import { mobileNotificationService } from "@/services/mobileNotificationService";

interface MobileAppProps {
  children: React.ReactNode;
}

export const MobileApp = ({ children }: MobileAppProps) => {
  const { isNative } = useMobileCapacitor();

  useEffect(() => {
    if (isNative) {
      // Initialize mobile services
      mobileNotificationService.initialize();
    }
  }, [isNative]);

  return <>{children}</>;
};
