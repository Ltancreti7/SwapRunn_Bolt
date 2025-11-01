import { useState } from "react";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vinScannerService } from "@/services/vinScannerService";
import { useMobileCapacitor } from "@/hooks/useMobileCapacitor";
import { ImpactStyle } from "@capacitor/haptics";
import { toast } from "@/hooks/use-toast";
import { WebVINScanner } from "./WebVINScanner";

interface VehicleInfo {
  vin: string;
  year: string;
  make: string;
  model: string;
  transmission: string;
  trim: string;
}

interface VINScannerProps {
  onVINScanned: (vehicleInfo: VehicleInfo) => void;
}

export const VINScanner = ({ onVINScanned }: VINScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWebScanner, setShowWebScanner] = useState(false);
  const { isNative, triggerHaptic } = useMobileCapacitor();

  const handleScanVIN = async () => {
    if (!isNative) {
      setShowWebScanner(true);
      return;
    }

    try {
      setIsScanning(true);
      await triggerHaptic(ImpactStyle.Light);

      const vehicleInfo = await vinScannerService.scanAndDecodeVIN();

      if (vehicleInfo) {
        setShowSuccess(true);
        await triggerHaptic(ImpactStyle.Medium);

        onVINScanned({
          vin: vehicleInfo.vin,
          year: vehicleInfo.year,
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          transmission: vehicleInfo.transmission,
          trim: vehicleInfo.trim,
        });

        toast({
          title: "✅ Vehicle info loaded",
          description: `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
        });

        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error: any) {
      await triggerHaptic(ImpactStyle.Heavy);
      toast({
        title: "Scan failed",
        description:
          error.message ||
          "Could not scan VIN. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleWebResult = async (vin: string) => {
    try {
      setIsScanning(true);
      const vehicleInfo = await vinScannerService.decodeManualVIN(vin);
      if (vehicleInfo) {
        setShowSuccess(true);
        onVINScanned({
          vin: vehicleInfo.vin,
          year: vehicleInfo.year,
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          transmission: vehicleInfo.transmission,
          trim: vehicleInfo.trim,
        });
        toast({
          title: "✅ Vehicle info loaded",
          description: `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
        });
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description:
          error?.message ||
          "Could not scan VIN. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setShowWebScanner(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleScanVIN}
        disabled={isScanning}
        className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 text-base shadow-lg"
      >
        {isScanning ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            Scanning VIN...
          </>
        ) : showSuccess ? (
          <>
            <CheckCircle2 className="w-8 h-8" />
            VIN Scanned!
          </>
        ) : (
          <>
            <Camera className="w-8 h-8" />
            Scan VIN
          </>
        )}
      </Button>

      <WebVINScanner
        isOpen={showWebScanner}
        onClose={() => setShowWebScanner(false)}
        onResult={handleWebResult}
      />
    </>
  );
};
