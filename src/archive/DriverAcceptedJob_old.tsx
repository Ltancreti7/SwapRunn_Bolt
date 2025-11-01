import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Clock, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
interface JobDetail {
  id: string;
  type: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  specific_time?: string;
  timeframe?: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  transmission?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  dealer_id: string;
  created_by?: string | null;
}

interface AssignmentDetail {
  id: string;
  started_at?: string;
  accepted_at?: string;
}

type AssignmentWithJob = {
  id: string;
  started_at: string | null;
  accepted_at: string | null;
  jobs: JobDetail | null;
};

export default function DriverAcceptedJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchJobDetails = useCallback(async () => {
    if (!jobId || !userProfile?.driver_id) {
      return;
    }

    try {
      setIsLoading(true);

      // Fetch job and assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select(
          `
          id,
          started_at,
          accepted_at,
          jobs (
            id,
            type,
            status,
            pickup_address,
            delivery_address,
            pickup_lat,
            pickup_lng,
            delivery_lat,
            delivery_lng,
            specific_time,
            timeframe,
            year,
            make,
            model,
            vin,
            transmission,
            customer_name,
            customer_phone,
            notes,
            dealer_id,
            created_by
          )
        `,
        )
        .eq("job_id", jobId)
        .eq("driver_id", userProfile.driver_id)
        .maybeSingle<AssignmentWithJob>();

      if (assignmentError) throw assignmentError;

      if (assignmentData?.jobs) {
        setJobDetail(assignmentData.jobs);
        setAssignment({
          id: assignmentData.id,
          started_at: assignmentData.started_at,
          accepted_at: assignmentData.accepted_at,
        });
      } else {
        setJobDetail(null);
        setAssignment(null);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [jobId, toast, userProfile?.driver_id]);

  useEffect(() => {
    if (jobId && userProfile?.driver_id) {
      fetchJobDetails();
    }
  }, [fetchJobDetails, jobId, userProfile?.driver_id]);

  const handleStartDelivery = async () => {
    if (!assignment?.id) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("assignments")
        .update({ started_at: new Date().toISOString() })
        .eq("id", assignment.id);

      if (error) throw error;

      // Update job status
      await supabase
        .from("jobs")
        .update({ status: "in_progress" })
        .eq("id", jobId);

      toast({
        title: "Delivery Started",
        description: "Good luck on your delivery!",
      });

      // Refresh data
      fetchJobDetails();
    } catch (error) {
      console.error("Error starting delivery:", error);
      toast({
        title: "Error",
        description: "Failed to start delivery",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelJob = async () => {
    if (!confirm("Are you sure you want to cancel this job?")) return;

    try {
      setIsUpdating(true);

      // Delete assignment
      await supabase.from("assignments").delete().eq("id", assignment?.id);

      // Update job status back to open
      await supabase.from("jobs").update({ status: "open" }).eq("id", jobId);

      toast({
        title: "Job Cancelled",
        description: "You have cancelled this delivery",
      });

      navigate("/driver/dashboard");
    } catch (error) {
      console.error("Error cancelling job:", error);
      toast({
        title: "Error",
        description: "Failed to cancel job",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (address: string, lat?: number, lng?: number) => {
    // Use coordinates if available, otherwise fallback to address
    if (lat && lng) {
      const url = `maps://?daddr=${lat},${lng}`;
      window.location.href = url;
    } else {
      const encodedAddress = encodeURIComponent(address);
      const url = `maps://?daddr=${encodedAddress}`;
      window.location.href = url;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64 bg-white/10" />
          <Skeleton className="h-48 w-full bg-white/10" />
          <Skeleton className="h-32 w-full bg-white/10" />
          <Skeleton className="h-32 w-full bg-white/10" />
        </div>
      </div>
    );
  }

  if (!jobDetail) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <Card className="bg-card border-border max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This job doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/driver/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasStarted = !!assignment?.started_at;

  return (
    <div className="min-h-screen bg-black text-white font-inter">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Upcoming Delivery</h1>
          <p className="text-white/70">
            Review job details and start when ready
          </p>
        </div>

        {/* Vehicle Info Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-soft rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-white">
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/50">Year</p>
                <p className="text-white font-medium">
                  {jobDetail.year || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/50">Make</p>
                <p className="text-white font-medium">
                  {jobDetail.make || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/50">Model</p>
                <p className="text-white font-medium">
                  {jobDetail.model || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/50">Transmission</p>
                <p className="text-white font-medium">
                  {jobDetail.transmission || "N/A"}
                </p>
              </div>
            </div>
            {jobDetail.vin && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-sm text-white/50">VIN</p>
                <p className="text-white font-mono text-sm">{jobDetail.vin}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-soft rounded-xl">
          <CardContent className="p-4 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-white/50 mb-1">Delivery Address</p>
                <p className="text-white font-medium">
                  {jobDetail.delivery_address}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
              onClick={() =>
                handleNavigate(
                  jobDetail.delivery_address,
                  jobDetail.delivery_lat,
                  jobDetail.delivery_lng,
                )
              }
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Pickup Address */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-soft rounded-xl">
          <CardContent className="p-4 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="w-5 h-5 text-white/50 mt-0.5" />
              <div>
                <p className="text-sm text-white/50 mb-1">
                  Pickup Address (Dealership)
                </p>
                <p className="text-white font-medium">
                  {jobDetail.pickup_address}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() =>
                handleNavigate(
                  jobDetail.pickup_address,
                  jobDetail.pickup_lat,
                  jobDetail.pickup_lng,
                )
              }
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled Time */}
        {(jobDetail.specific_time || jobDetail.timeframe) && (
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-soft rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-white/50">Scheduled Time</p>
                <p className="text-white font-medium">
                  {jobDetail.specific_time || jobDetail.timeframe}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Contact */}
        {(jobDetail.customer_name || jobDetail.customer_phone) && (
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-soft rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white">
                Customer Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobDetail.customer_name && (
                <div>
                  <p className="text-sm text-white/50">Name</p>
                  <p className="text-white font-medium">
                    {jobDetail.customer_name}
                  </p>
                </div>
              )}
              {jobDetail.customer_phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => handleCall(jobDetail.customer_phone)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Customer
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {jobDetail.notes && (
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-soft rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white">
                Special Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">{jobDetail.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="pt-4 space-y-4">
          <Button
            onClick={
              hasStarted
                ? () => navigate("/driver/dashboard")
                : handleStartDelivery
            }
            disabled={isUpdating}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-lg rounded-xl shadow-elegant transition-all duration-200 hover:shadow-soft hover:-translate-y-0.5"
          >
            {hasStarted ? "Return to Dealership" : "Start Delivery"}
          </Button>

          {!hasStarted && (
            <button
              onClick={handleCancelJob}
              disabled={isUpdating}
              className="w-full text-center text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              Cancel Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
