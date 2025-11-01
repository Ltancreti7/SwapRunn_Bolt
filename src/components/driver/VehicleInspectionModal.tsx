import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, CheckCircle, AlertTriangle } from "lucide-react";
import { mobileCameraService } from "@/services/mobileCameraService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface VehicleInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (photos: string[]) => void;
  jobId: string;
  assignmentId: string;
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: number;
  };
}

interface PhotoSlot {
  id: string;
  label: string;
  description: string;
  photo?: string;
  required: boolean;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  {
    id: "front",
    label: "Front View",
    description: "Full front of vehicle",
    required: true,
  },
  {
    id: "rear",
    label: "Rear View",
    description: "Full rear of vehicle",
    required: true,
  },
  {
    id: "left",
    label: "Left Side",
    description: "Driver side of vehicle",
    required: true,
  },
  {
    id: "right",
    label: "Right Side",
    description: "Passenger side of vehicle",
    required: true,
  },
  {
    id: "interior",
    label: "Interior",
    description: "Dashboard and seats",
    required: false,
  },
  {
    id: "odometer",
    label: "Odometer",
    description: "Current mileage reading",
    required: false,
  },
];

export default function VehicleInspectionModal({
  isOpen,
  onClose,
  onComplete,
  jobId,
  assignmentId,
  vehicleInfo,
}: VehicleInspectionModalProps) {
  const [photos, setPhotos] = useState<PhotoSlot[]>(PHOTO_SLOTS);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const takePhoto = async (slotId: string) => {
    try {
      const hasPermission = await mobileCameraService.requestPermissions();
      if (!hasPermission) {
        toast({
          title: "Permission Required",
          description: "Camera access is needed to take photos",
          variant: "destructive",
        });
        return;
      }

      const photoDataUrl = await mobileCameraService.takePhoto();
      if (photoDataUrl) {
        setPhotos((prev) =>
          prev.map((slot) =>
            slot.id === slotId ? { ...slot, photo: photoDataUrl } : slot,
          ),
        );
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      toast({
        title: "Camera Error",
        description: "Failed to take photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectPhoto = async (slotId: string) => {
    try {
      const photoDataUrl = await mobileCameraService.selectPhoto();
      if (photoDataUrl) {
        setPhotos((prev) =>
          prev.map((slot) =>
            slot.id === slotId ? { ...slot, photo: photoDataUrl } : slot,
          ),
        );
      }
    } catch (error) {
      console.error("Error selecting photo:", error);
      toast({
        title: "Upload Error",
        description: "Failed to select photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removePhoto = (slotId: string) => {
    setPhotos((prev) =>
      prev.map((slot) =>
        slot.id === slotId ? { ...slot, photo: undefined } : slot,
      ),
    );
  };

  const uploadPhoto = async (
    photoDataUrl: string,
    filename: string,
  ): Promise<string | null> => {
    try {
      // Convert data URL to blob
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();

      const filePath = `vehicle-inspections/${assignmentId}/${filename}`;

      const { error } = await supabase.storage
        .from("vehicle-photos")
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("vehicle-photos")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      return null;
    }
  };

  const handleComplete = async () => {
    const requiredPhotos = photos.filter((p) => p.required);
    const missingRequired = requiredPhotos.filter((p) => !p.photo);

    if (missingRequired.length > 0) {
      toast({
        title: "Missing Required Photos",
        description: `Please take photos for: ${missingRequired.map((p) => p.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const photo of photos) {
        if (photo.photo) {
          const filename = `${photo.id}_${Date.now()}.jpg`;
          const url = await uploadPhoto(photo.photo, filename);
          if (url) {
            uploadedUrls.push(url);
          }
        }
      }

      // Save inspection record to database
      const { error } = await supabase.from("vehicle_inspections").insert([
        {
          job_id: jobId,
          assignment_id: assignmentId,
          photo_urls: uploadedUrls,
          inspection_type: "pre_drive",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Inspection Complete",
        description: `${uploadedUrls.length} photos uploaded successfully`,
      });

      onComplete(uploadedUrls);
    } catch (error) {
      console.error("Error completing inspection:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to save vehicle inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsCompleting(false);
    }
  };

  const requiredComplete = photos
    .filter((p) => p.required)
    .every((p) => p.photo);
  const totalPhotos = photos.filter((p) => p.photo).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Vehicle Inspection
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {vehicleInfo && (
              <p>
                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
              </p>
            )}
            <p>Document the vehicle condition before starting the drive</p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Progress</span>
            </div>
            <span className="text-sm">
              {totalPhotos}/{photos.length} photos taken
              {requiredComplete && (
                <CheckCircle className="w-4 h-4 text-success ml-2 inline" />
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((slot) => (
              <Card
                key={slot.id}
                className={`${slot.required && !slot.photo ? "border-warning" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{slot.label}</h3>
                    {slot.required && !slot.photo && (
                      <span className="text-xs text-warning">Required</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {slot.description}
                  </p>

                  {slot.photo ? (
                    <div className="relative">
                      <img
                        src={slot.photo}
                        alt={slot.label}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removePhoto(slot.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => takePhoto(slot.id)}
                        className="h-20 flex-col"
                      >
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-xs">Camera</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectPhoto(slot.id)}
                        className="h-20 flex-col"
                      >
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-xs">Gallery</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCompleting}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!requiredComplete || isCompleting}
            className="min-w-32"
          >
            {isUploading ? "Uploading..." : "Complete Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
