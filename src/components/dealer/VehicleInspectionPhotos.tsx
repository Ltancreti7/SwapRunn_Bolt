import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, ImageIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VehicleInspectionPhotosProps {
  assignmentId: string;
}

interface Inspection {
  id: string;
  inspection_type: "pre_drive" | "post_drive";
  photo_urls: string[];
  created_at: string;
}

export function VehicleInspectionPhotos({
  assignmentId,
}: VehicleInspectionPhotosProps) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, [assignmentId]);

  const fetchInspections = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("vehicle_inspections")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Type-safe mapping
      const typedInspections: Inspection[] = (data || []).map((item) => ({
        id: item.id,
        inspection_type: item.inspection_type as "pre_drive" | "post_drive",
        photo_urls: item.photo_urls as string[],
        created_at: item.created_at,
      }));

      setInspections(typedInspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
    } finally {
      setLoading(false);
    }
  };

  const preDriveInspection = inspections.find(
    (i) => i.inspection_type === "pre_drive",
  );
  const postDriveInspection = inspections.find(
    (i) => i.inspection_type === "post_drive",
  );

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-white/60">Loading inspection photos...</p>
        </CardContent>
      </Card>
    );
  }

  if (inspections.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-white/60">
            <Camera className="h-5 w-5" />
            <p>No inspection photos uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-neutral-800 to-neutral-900 border-white/10 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Camera className="h-5 w-5 text-[#E11900]" />
            Vehicle Inspection Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pre-Departure Photos */}
          {preDriveInspection && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="bg-blue-500/20 text-blue-400 border-blue-400/30"
                >
                  Pre-Departure
                </Badge>
                <span className="text-white/60 text-sm">
                  {new Date(preDriveInspection.created_at).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {preDriveInspection.photo_urls.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setSelectedImage(url)}
                    className="relative group aspect-square rounded-xl overflow-hidden border-2 border-white/20 hover:border-[#E11900] transition-all hover:scale-105"
                  >
                    <img
                      src={url}
                      alt={`Pre-departure ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Post-Delivery Photos */}
          {postDriveInspection && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="bg-green-500/20 text-green-400 border-green-400/30"
                >
                  Post-Delivery
                </Badge>
                <span className="text-white/60 text-sm">
                  {new Date(postDriveInspection.created_at).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {postDriveInspection.photo_urls.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setSelectedImage(url)}
                    className="relative group aspect-square rounded-xl overflow-hidden border-2 border-white/20 hover:border-[#E11900] transition-all hover:scale-105"
                  >
                    <img
                      src={url}
                      alt={`Post-delivery ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full-size Image Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl bg-black/95 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Inspection Photo</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Full size inspection"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
