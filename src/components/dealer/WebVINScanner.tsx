import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { vinScannerService } from "@/services/vinScannerService";

interface WebVINScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (vin: string) => void;
}

export const WebVINScanner: React.FC<WebVINScannerProps> = ({
  isOpen,
  onClose,
  onResult,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [userInitiated, setUserInitiated] = useState(false);
  const [restartNonce, setRestartNonce] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = null;
    let stopped = false;

    const stopAll = () => {
      try {
        controlsRef.current?.stop();
      } catch {}
      controlsRef.current = null;
      const video = videoRef.current;
      const stream = video?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (video) {
        video.srcObject = null;
      }
    };

    const pickBackCamera = async (): Promise<string | undefined> => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter((d) => d.kind === "videoinput");
        const back = videos.find((d) => /back|rear|environment/i.test(d.label));
        return back?.deviceId || videos[0]?.deviceId;
      } catch {
        return undefined;
      }
    };

    const start = async () => {
      if (!isOpen || !videoRef.current || stopped || !userInitiated) return;

      // Feature detection
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera not supported in this browser. Please enter VIN manually.",
        );
        return;
      }

      setIsStarting(true);
      setError(null);
      setPermissionDenied(false);

      try {
        // Preflight permission so device labels are populated
        const preflight = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        preflight.getTracks().forEach((t) => t.stop());

        // Configure hints to improve reliability for VIN barcodes
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_128,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        reader = new BrowserMultiFormatReader(hints as any);

        const deviceId = await pickBackCamera();

        const onDecode = (result: any) => {
          if (!result) return;
          const text = result.getText()?.trim().toUpperCase();
          if (text && vinScannerService.validateVIN(text)) {
            stopAll();
            onResult(text);
          }
        };

        let controls: IScannerControls;
        if (deviceId) {
          controls = await reader.decodeFromVideoDevice(
            deviceId,
            videoRef.current!,
            (result) => {
              if (result) onDecode(result);
            },
          );
        } else {
          controls = await reader.decodeFromConstraints(
            {
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            videoRef.current!,
            (result) => {
              if (result) onDecode(result);
            },
          );
        }
        controlsRef.current = controls;
      } catch (e: any) {
        console.error("Web VIN scan error", e);
        if (e?.name === "NotAllowedError") {
          setPermissionDenied(true);
        }
        if (e?.name === "NotReadableError") {
          // Camera might be busy; retry once after a short delay
          await new Promise((r) => setTimeout(r, 300));
          stopAll();
          try {
            await start();
            return;
          } catch {}
        }
        setError(e?.message || "Unable to start camera.");
      } finally {
        setIsStarting(false);
      }
    };

    start();

    return () => {
      // Cleanup on close/unmount
      stopped = true;
      stopAll();
      reader = null;
    };
  }, [isOpen, onResult, userInitiated, restartNonce]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Scan VIN</DialogTitle>
          <DialogDescription>
            Align the VIN barcode inside the frame, then tap Start Camera.
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />
          {/* Center guide */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="w-[88%] h-28 rounded-xl border-2 border-[#E11900]/80" />
          </div>

          {/* Start overlay to ensure user gesture for permissions */}
          {!userInitiated && (
            <div className="absolute inset-0 grid place-items-center bg-black/70">
              <Button onClick={() => setUserInitiated(true)} className="px-6">
                Start Camera
              </Button>
            </div>
          )}

          {/* Permission denied overlay with retry */}
          {permissionDenied && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center bg-black/80 px-4">
              <p className="text-sm text-white/90">
                Camera access is blocked. Please allow camera permissions in
                your browser settings, then tap Try Again.
              </p>
              <Button
                onClick={() => {
                  setPermissionDenied(false);
                  setError(null);
                  setUserInitiated(false);
                  setRestartNonce((n) => n + 1);
                  setTimeout(() => setUserInitiated(true), 0);
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {error && (
          <p className="px-4 pt-3 pb-1 text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <Button
            variant="secondary"
            onClick={() => {
              controlsRef.current?.stop();
              onClose();
            }}
            className="w-1/2"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Restart scanning without closing the dialog
              try {
                controlsRef.current?.stop();
              } catch {}
              controlsRef.current = null;
              setError(null);
              setPermissionDenied(false);
              setUserInitiated(true);
              setRestartNonce((n) => n + 1);
            }}
            disabled={isStarting}
            className="w-1/2"
          >
            {isStarting ? "Starting…" : "Restart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
