import {
  BarcodeScanner,
  BarcodeFormat,
} from "@capacitor-mlkit/barcode-scanning";
import { Capacitor } from "@capacitor/core";

interface VehicleInfo {
  vin: string;
  year: string;
  make: string;
  model: string;
  transmission: string;
  trim: string;
  bodyClass: string;
  engineInfo: string;
}

class VINScannerService {
  private isNative = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  // Validate VIN format
  validateVIN(vin: string): boolean {
    // VIN must be exactly 17 characters, no I, O, or Q
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin.toUpperCase());
  }

  // Request camera permissions
  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) return true;

    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === "granted" || camera === "limited";
    } catch (error) {
      console.error("Error requesting camera permissions:", error);
      return false;
    }
  }

  // Scan VIN barcode using camera
  async scanVINBarcode(): Promise<string | null> {
    if (!this.isNative) {
      throw new Error("Barcode scanning is only available on native platforms");
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Camera permission denied");
      }

      const result = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Code39, BarcodeFormat.Code128], // VIN barcodes use these formats
      });

      if (result.barcodes && result.barcodes.length > 0) {
        const vin = result.barcodes[0].rawValue;
        if (this.validateVIN(vin)) {
          return vin.toUpperCase();
        } else {
          throw new Error("Invalid VIN format");
        }
      }

      return null;
    } catch (error) {
      console.error("Error scanning VIN barcode:", error);
      throw error;
    }
  }

  // Decode VIN using NHTSA API
  async decodeVIN(vin: string): Promise<VehicleInfo | null> {
    if (!this.validateVIN(vin)) {
      throw new Error("Invalid VIN format");
    }

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`,
      );

      if (!response.ok) {
        throw new Error("Failed to decode VIN");
      }

      const data = await response.json();

      if (!data.Results || data.Results.length === 0) {
        throw new Error("No vehicle data found for this VIN");
      }

      // Extract relevant fields from API response
      const results = data.Results;
      const getValue = (variable: string) => {
        const item = results.find((r: any) => r.Variable === variable);
        return item?.Value || "";
      };

      const vehicleInfo: VehicleInfo = {
        vin: vin.toUpperCase(),
        year: getValue("Model Year"),
        make: getValue("Make"),
        model: getValue("Model"),
        transmission: getValue("Transmission Style"),
        trim: getValue("Trim"),
        bodyClass: getValue("Body Class"),
        engineInfo: getValue("Engine Model"),
      };

      // Validate we got essential data
      if (!vehicleInfo.make || !vehicleInfo.model) {
        throw new Error("Incomplete vehicle data from VIN");
      }

      return vehicleInfo;
    } catch (error) {
      console.error("Error decoding VIN:", error);
      throw error;
    }
  }

  // Complete flow: scan and decode
  async scanAndDecodeVIN(): Promise<VehicleInfo | null> {
    const vin = await this.scanVINBarcode();
    if (!vin) return null;

    return await this.decodeVIN(vin);
  }

  // Manual VIN decode (for manual entry)
  async decodeManualVIN(vin: string): Promise<VehicleInfo | null> {
    return await this.decodeVIN(vin);
  }
}

export const vinScannerService = new VINScannerService();
