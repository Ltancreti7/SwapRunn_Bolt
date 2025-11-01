import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Phone,
  MapPin,
  DollarSign,
  Clock,
  Car,
  Camera,
  X,
  ChevronDown,
  Gauge,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DetailedJobViewProps {
  assignment: any;
  job: any;
  driverId: string;
  onJobUpdate: () => void;
}

export function DetailedJobView({
  assignment,
  job,
  driverId,
  onJobUpdate,
}: DetailedJobViewProps) {
  const { toast } = useToast();
  const [isPunchedIn, setIsPunchedIn] = useState(!!assignment.started_at);
  const [startOdometer, setStartOdometer] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [dealerPlate, setDealerPlate] = useState("");
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState("");
  const [estimatedPayout, setEstimatedPayout] = useState(0);
  const [preDeparturePhotos, setPreDeparturePhotos] = useState<File[]>([]);
  const [preDeparturePhotoUrls, setPreDeparturePhotoUrls] = useState<string[]>(
    [],
  );

  // Collapsible states - Pre-Departure open by default, others collapsed
  const [openSections, setOpenSections] = useState({
    vehicle: false,
    addresses: false,
    customer: false,
    preDeparture: !isPunchedIn,
    payout: false,
    tripDetails: isPunchedIn,
    proofOfDelivery: false,
  });

  const handleStartJob = async () => {
    if (!startOdometer) {
      toast({
        title: "Missing Information",
        description: "Please enter starting odometer reading before starting.",
        variant: "destructive",
      });
      return;
    }

    if (preDeparturePhotos.length === 0) {
      toast({
        title: "Missing Photos",
        description:
          "Please upload at least one exterior photo before starting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload pre-departure photos to Supabase storage
      const uploadedPhotoUrls: string[] = [];

      for (const photo of preDeparturePhotos) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${assignment.id}_pre_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${driverId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("vehicle-photos")
          .upload(filePath, photo);

        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          throw new Error("Failed to upload photos");
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("vehicle-photos").getPublicUrl(filePath);

        uploadedPhotoUrls.push(publicUrl);
      }

      // Save vehicle inspection record
      const { error: inspectionError } = await (supabase as any)
        .from("vehicle_inspections")
        .insert({
          job_id: job.id,
          assignment_id: assignment.id,
          inspection_type: "pre_drive",
          photo_urls: uploadedPhotoUrls,
        });

      if (inspectionError) throw inspectionError;

      // Update assignment and job
      const { error: assignmentError } = await supabase
        .from("assignments")
        .update({ started_at: new Date().toISOString() })
        .eq("id", assignment.id);

      if (assignmentError) throw assignmentError;

      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "in_progress" })
        .eq("id", job.id);

      if (jobError) throw jobError;

      setIsPunchedIn(true);
      setOpenSections({
        ...openSections,
        preDeparture: false,
        tripDetails: true,
      });
      toast({
        title: "Job Started",
        description: "Timer has begun. Drive safely!",
      });
      onJobUpdate();
    } catch (error) {
      console.error("Error starting job:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to start job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReturnToDealership = async () => {
    if (!endOdometer || !dealerPlate) {
      toast({
        title: "Missing Information",
        description:
          "Please fill in odometer and dealer plate before completing.",
        variant: "destructive",
      });
      return;
    }

    if (!proofPhoto) {
      toast({
        title: "Missing Photo",
        description: "Please upload a delivery proof photo before completing.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload delivery proof photo to Supabase storage
      const fileExt = proofPhoto.name.split(".").pop();
      const fileName = `${assignment.id}_delivery_${Date.now()}.${fileExt}`;
      const filePath = `${driverId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("vehicle-photos")
        .upload(filePath, proofPhoto);

      if (uploadError) {
        console.error("Error uploading photo:", uploadError);
        throw new Error("Failed to upload delivery photo");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("vehicle-photos").getPublicUrl(filePath);

      // Save delivery inspection record
      const { error: inspectionError } = await (supabase as any)
        .from("vehicle_inspections")
        .insert({
          job_id: job.id,
          assignment_id: assignment.id,
          inspection_type: "post_drive",
          photo_urls: [publicUrl],
        });

      if (inspectionError) throw inspectionError;

      // Update assignment and job
      const { error: assignmentError } = await supabase
        .from("assignments")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", assignment.id);

      if (assignmentError) throw assignmentError;

      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "completed" })
        .eq("id", job.id);

      if (jobError) throw jobError;

      toast({
        title: "Job Completed",
        description: "Great work! Your payout will be processed.",
      });
      onJobUpdate();
    } catch (error) {
      console.error("Error completing job:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to complete job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setProofPhoto(e.target.files[0]);
    }
  };

  const handlePreDeparturePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPreDeparturePhotos((prev) => [...prev, ...newFiles]);

      // Create preview URLs
      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      setPreDeparturePhotoUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const removePreDeparturePhoto = (index: number) => {
    setPreDeparturePhotos((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(preDeparturePhotoUrls[index]);
    setPreDeparturePhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 px-4 py-2">
      {/* 1. Vehicle Information */}
      <Collapsible
        open={openSections.vehicle}
        onOpenChange={(open) =>
          setOpenSections({ ...openSections, vehicle: open })
        }
        className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
      >
        <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-2xl group">
          <div className="flex items-center gap-3">
            <Car className="h-6 w-6 text-[#E11900]" />
            <h3 className="text-xl font-bold text-white">
              Vehicle Information
            </h3>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 group-hover:text-[#E11900] transition-all ${openSections.vehicle ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-5">
          <div className="grid grid-cols-2 gap-4 mt-2 text-white/80">
            <div>
              <p className="text-white/60 text-sm">Year</p>
              <p className="text-lg font-semibold">{job.year || "N/A"}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Make</p>
              <p className="text-lg font-semibold">{job.make || "N/A"}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Model</p>
              <p className="text-lg font-semibold">{job.model || "N/A"}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">VIN</p>
              <p className="text-sm font-mono break-all">{job.vin || "N/A"}</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 2. Pickup & Delivery */}
      <Collapsible
        open={openSections.addresses}
        onOpenChange={(open) =>
          setOpenSections({ ...openSections, addresses: open })
        }
        className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
      >
        <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-2xl group">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Pickup & Delivery</h3>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 group-hover:text-[#E11900] transition-all ${openSections.addresses ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-5">
          <div className="space-y-4 mt-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <p className="text-white/60 text-sm font-semibold">
                  Pickup Address
                </p>
              </div>
              <p className="text-white/90 ml-4">
                {job.pickup_address || "Not specified"}
              </p>
            </div>
            <div className="h-px bg-white/10"></div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#E11900]"></div>
                <p className="text-white/60 text-sm font-semibold">
                  Delivery Address
                </p>
              </div>
              <p className="text-white/90 ml-4">
                {job.delivery_address || "Not specified"}
              </p>
            </div>
            {job.specific_time && (
              <>
                <div className="h-px bg-white/10"></div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#E11900]" />
                  <div>
                    <p className="text-white/60 text-sm">Scheduled Time</p>
                    <p className="text-white/90 font-semibold">
                      {job.specific_time}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 3. Customer Info */}
      <Collapsible
        open={openSections.customer}
        onOpenChange={(open) =>
          setOpenSections({ ...openSections, customer: open })
        }
        className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
      >
        <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-2xl group">
          <div className="flex items-center gap-3">
            <Phone className="h-6 w-6 text-green-400" />
            <h3 className="text-xl font-bold text-white">Customer Info</h3>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 group-hover:text-[#E11900] transition-all ${openSections.customer ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-5">
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Name</p>
                <p className="text-white/90 font-semibold">
                  {job.customer_name || "Not provided"}
                </p>
              </div>
            </div>
            <div className="h-px bg-white/10"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-white/60" />
                <span className="text-white/80">
                  {job.customer_phone || "Not provided"}
                </span>
              </div>
              {job.customer_phone && (
                <Button
                  size="sm"
                  className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg"
                  onClick={() =>
                    (window.location.href = `tel:${job.customer_phone}`)
                  }
                >
                  Call
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 4. Pre-Departure Checklist - Only show before starting */}
      {!isPunchedIn && (
        <Collapsible
          open={openSections.preDeparture}
          onOpenChange={(open) =>
            setOpenSections({ ...openSections, preDeparture: open })
          }
          className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#E11900]/30"
        >
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-2xl group">
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-[#E11900]" />
              <h3 className="text-xl font-bold text-white">
                Pre-Departure Checklist
              </h3>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 group-hover:text-[#E11900] transition-all ${openSections.preDeparture ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-5 pb-5">
            <div className="space-y-5 mt-2">
              <p className="text-white/70 text-sm">
                Complete these items before starting your delivery
              </p>

              {/* Starting Odometer */}
              <div className="space-y-2">
                <Label
                  htmlFor="pre-start-odometer"
                  className="text-white font-semibold text-base flex items-center gap-2"
                >
                  <Gauge className="h-5 w-5 text-[#E11900]" />
                  Starting Odometer Reading *
                </Label>
                <Input
                  id="pre-start-odometer"
                  type="number"
                  placeholder="Enter current mileage"
                  value={startOdometer}
                  onChange={(e) => setStartOdometer(e.target.value)}
                  className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/40 h-14 text-lg"
                  required
                />
              </div>

              {/* Exterior Photos */}
              <div className="space-y-3">
                <Label className="text-white font-semibold text-base flex items-center gap-2">
                  <Camera className="h-5 w-5 text-[#E11900]" />
                  Exterior Photos (Before Departure) *
                </Label>
                <p className="text-white/60 text-sm">
                  Take photos of all sides of the vehicle
                </p>

                <Input
                  id="pre-departure-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePreDeparturePhotoUpload}
                  className="rounded-xl border-white/20 bg-white/10 text-white file:bg-[#E11900] file:text-white file:border-0 file:px-5 file:py-3 file:rounded-lg file:mr-4 file:font-semibold h-14"
                />

                {preDeparturePhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {preDeparturePhotoUrls.map((url, idx) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt={`Pre-departure ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removePreDeparturePhoto(idx)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          Photo {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {preDeparturePhotos.length > 0 && (
                  <Badge className="bg-green-500/20 text-green-200 border-green-400/40 text-sm py-1 px-3">
                    ✓ {preDeparturePhotos.length} photo
                    {preDeparturePhotos.length > 1 ? "s" : ""} uploaded
                  </Badge>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 5. Trip Details - Only show after starting */}
      {isPunchedIn && (
        <Collapsible
          open={openSections.tripDetails}
          onOpenChange={(open) =>
            setOpenSections({ ...openSections, tripDetails: open })
          }
          className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
        >
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-2xl group">
            <div className="flex items-center gap-3">
              <Gauge className="h-6 w-6 text-[#E11900]" />
              <h3 className="text-xl font-bold text-white">Trip Details</h3>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 group-hover:text-[#E11900] transition-all ${openSections.tripDetails ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-5 pb-5">
            <div className="space-y-4 mt-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="start-odometer"
                    className="text-white/80 font-semibold"
                  >
                    Start Odometer
                  </Label>
                  <Input
                    id="start-odometer"
                    type="number"
                    value={startOdometer}
                    disabled
                    className="rounded-xl bg-white/5 border-white/10 text-white/50 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="end-odometer"
                    className="text-white/80 font-semibold"
                  >
                    End Odometer *
                  </Label>
                  <Input
                    id="end-odometer"
                    type="number"
                    placeholder="Enter ending miles"
                    value={endOdometer}
                    onChange={(e) => setEndOdometer(e.target.value)}
                    className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/40 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="dealer-plate"
                  className="text-white/80 font-semibold"
                >
                  Dealer Plate *
                </Label>
                <Select value={dealerPlate} onValueChange={setDealerPlate}>
                  <SelectTrigger className="rounded-xl border-white/20 bg-white/10 text-white h-12">
                    <SelectValue placeholder="Select dealer plate" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="Y">Y</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="AF">AF</SelectItem>
                    <SelectItem value="X">X</SelectItem>
                    <SelectItem value="AE">AE</SelectItem>
                    <SelectItem value="Z">Z</SelectItem>
                    <SelectItem value="AA">AA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 6. Proof of Delivery - Only show after starting */}
      {isPunchedIn && (
        <Collapsible
          open={openSections.proofOfDelivery}
          onOpenChange={(open) =>
            setOpenSections({ ...openSections, proofOfDelivery: open })
          }
          className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
        >
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-2xl group">
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">
                Proof of Delivery
              </h3>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 group-hover:text-[#E11900] transition-all ${openSections.proofOfDelivery ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-5 pb-5">
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label
                  htmlFor="photo-upload"
                  className="text-white/80 font-semibold"
                >
                  Upload Photo
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="rounded-xl border-white/20 bg-white/10 text-white file:bg-[#E11900] file:text-white file:border-0 file:px-5 file:py-3 file:rounded-lg file:mr-4 file:font-semibold h-14"
                />
                {proofPhoto && (
                  <Badge className="bg-green-500/20 text-green-200 border-green-400/40 text-sm py-1 px-3 mt-2">
                    ✓ Uploaded
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="signature"
                  className="text-white/80 font-semibold"
                >
                  Customer Signature
                </Label>
                <Input
                  id="signature"
                  type="text"
                  placeholder="Customer name (digital signature)"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/40 h-12"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 7. Estimated Payout */}
      <Collapsible
        open={openSections.payout}
        onOpenChange={(open) =>
          setOpenSections({ ...openSections, payout: open })
        }
        className="bg-gradient-to-br from-[#E11900]/20 to-[#E11900]/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#E11900]/30"
      >
        <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors rounded-2xl group">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-[#E11900]" />
            <h3 className="text-xl font-bold text-white">Estimated Payout</h3>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 group-hover:text-[#E11900] transition-all ${openSections.payout ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-5">
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-white/60 text-sm mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-white">
                ${((job.estimated_pay_cents || 1800) / 100).toFixed(2)}
              </p>
            </div>
            {isPunchedIn && (
              <div className="text-right">
                <p className="text-white/60 text-sm mb-1">Time Elapsed</p>
                <p className="text-2xl font-semibold text-white">
                  {assignment.started_at
                    ? Math.floor(
                        (Date.now() -
                          new Date(assignment.started_at).getTime()) /
                          60000,
                      )
                    : 0}{" "}
                  min
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Button - Always visible */}
      <div className="pt-2 pb-4">
        {!isPunchedIn ? (
          <Button
            onClick={handleStartJob}
            className="w-full h-16 bg-[#E11900] hover:bg-[#E11900]/90 text-white text-xl font-bold rounded-2xl shadow-lg"
          >
            Start Job
          </Button>
        ) : (
          <Button
            onClick={handleReturnToDealership}
            className="w-full h-16 bg-[#E11900] hover:bg-[#E11900]/90 text-white text-xl font-bold rounded-2xl shadow-lg"
          >
            Return to Dealership
          </Button>
        )}
      </div>
    </div>
  );
}
