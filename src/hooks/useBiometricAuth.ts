import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const SERVER_ID = "app.swaprunn.auth";

/**
 * Hook for biometric authentication (Face ID / Touch ID)
 * Stores credentials securely in native keychain/keystore
 */
export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<
    "face" | "fingerprint" | "none"
  >("none");
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    if (!native) {
      setIsAvailable(false);
      return;
    }

    try {
      // Dynamically import the native biometric plugin
      const { NativeBiometric } = await import(
        "@capgo/capacitor-native-biometric"
      );
      const result = await NativeBiometric.isAvailable();
      setIsAvailable(result.isAvailable);

      // Map the biometry type enum to our type
      const typeMap: Record<number, "face" | "fingerprint" | "none"> = {
        0: "none",
        1: "fingerprint",
        2: "face",
      };
      setBiometryType(typeMap[result.biometryType] || "none");
    } catch (error) {
      console.log("Biometric auth not available:", error);
      setIsAvailable(false);
    }
  };

  /**
   * Prompt user for biometric authentication
   */
  const authenticate = async (
    reason = "Authenticate to login",
  ): Promise<boolean> => {
    if (!isAvailable || !isNative) return false;

    try {
      const { NativeBiometric } = await import(
        "@capgo/capacitor-native-biometric"
      );
      await NativeBiometric.verifyIdentity({
        reason,
        title: "SwapRunn Login",
        subtitle: reason,
        description: "Use biometric authentication to sign in",
      });
      return true;
    } catch (error) {
      console.error("Biometric auth failed:", error);
      return false;
    }
  };

  /**
   * Save credentials securely to device keychain/keystore
   */
  const saveCredentials = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    if (!isAvailable || !isNative) return false;

    try {
      const { NativeBiometric } = await import(
        "@capgo/capacitor-native-biometric"
      );
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: SERVER_ID,
      });
      return true;
    } catch (error) {
      console.error("Failed to save credentials:", error);
      return false;
    }
  };

  /**
   * Get saved credentials from device keychain/keystore
   */
  const getCredentials = async (): Promise<{
    email: string;
    password: string;
  } | null> => {
    if (!isAvailable || !isNative) return null;

    try {
      const { NativeBiometric } = await import(
        "@capgo/capacitor-native-biometric"
      );
      const result = await NativeBiometric.getCredentials({
        server: SERVER_ID,
      });
      return {
        email: result.username,
        password: result.password,
      };
    } catch (error) {
      console.log("No saved credentials found");
      return null;
    }
  };

  /**
   * Delete saved credentials from device keychain/keystore
   */
  const deleteCredentials = async (): Promise<void> => {
    if (!isAvailable || !isNative) return;

    try {
      const { NativeBiometric } = await import(
        "@capgo/capacitor-native-biometric"
      );
      await NativeBiometric.deleteCredentials({
        server: SERVER_ID,
      });
    } catch (error) {
      console.error("Failed to delete credentials:", error);
    }
  };

  return {
    isAvailable,
    biometryType,
    isNative,
    authenticate,
    saveCredentials,
    getCredentials,
    deleteCredentials,
  };
};
