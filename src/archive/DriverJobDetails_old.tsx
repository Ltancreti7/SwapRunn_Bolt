import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Navigation,
  Phone,
  Camera,
  Play,
  CheckCircle,
  Car,
  User,
  DollarSign,
  MapPin,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatButton } from "@/components/chat/ChatButton";
import { useAuth } from "@/hooks/useAuth";
import { useMobileCapacitor } from "@/hooks/useMobileCapacitor";
import { mobileCameraService } from "@/services/mobileCameraService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface JobDetail {
  id: string;
  type: "delivery" | "swap" | "parts" | "service";
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  distance_miles: number;
  requires_two: boolean;
  notes?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  customer_name?: string;
  customer_phone?: string;
  timeframe?: string;
  specific_date?: string;
  specific_time?: string;
  transmission?: string;
  assignments: {
    id: string;
    accepted_at: string;
    started_at?: string;
    ended_at?: string;
    driver_id: string;
  }[];
}

export default function DriverJobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { userProfile } = useAuth();
  const { isNative, triggerHaptic } = useMobileCapacitor();

  useEffect(() => {
    if (jobId) {
      fetchJobDetail();
    }
  }, [jobId]);

  const fetchJobDetail = async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          assignments!inner(*)
        `,
        )
        .eq("id", jobId)
        .single();

      if (error) throw error;
      setJobDetail(data);
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
  };

  const handleJobStatusUpdate = async (action: "start" | "complete") => {
    if (!jobDetail?.assignments[0]?.id || !userProfile?.driver_id) return;

    setIsUpdatingStatus(true);
    try {
      const updateField = action === "start" ? "started_at" : "ended_at";
      const statusValue = action === "start" ? "in_progress" : "completed";

      // Update assignment
      const { error: assignmentError } = await supabase
        .from("assignments")
        .update({ [updateField]: new Date().toISOString() })
        .eq("id", jobDetail.assignments[0].id);

      if (assignmentError) throw assignmentError;

      // Update job status
      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: statusValue })
        .eq("id", jobDetail.id);

      if (jobError) throw jobError;

      toast({
        title: action === "start" ? "Job Started" : "Job Completed",
        description:
          action === "start"
            ? "You've started this job"
            : "Great work! Job marked as complete",
      });

      // Refresh job details
      await fetchJobDetail();
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} job. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleNavigate = async (
    address: string,
    lat?: number,
    lng?: number,
  ) => {
    await triggerHaptic();

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

  const handleCall = async (phoneNumber: string) => {
    await triggerHaptic();

    if (isNative) {
      window.open(`tel:${phoneNumber}`, "_system");
    } else {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const handleTakePhoto = async () => {
    await triggerHaptic();

    try {
      const photoUrl = await mobileCameraService.takePhoto();
      if (photoUrl) {
        toast({
          title: "Photo Captured",
          description: "Photo saved for job documentation",
        });
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to take photo",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline">Open</Badge>;
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            In Progress
          </Badge>
        );
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJobTitle = () => {
    if (!jobDetail) return "";
    const { year, make, model, type } = jobDetail;
    const jobType = type === "swap" ? "Swap" : "Delivery";

    if (year && make && model) {
      return `${year} ${make} ${model} ${jobType}`;
    } else if (make && model) {
      return `${make} ${model} ${jobType}`;
    } else if (jobDetail.customer_name) {
      return `${jobType} for ${jobDetail.customer_name}`;
    }
    return `Vehicle ${jobType}`;
  };

  const calculatePay = () => {
    if (!jobDetail?.distance_miles) return 18;
    const miles = jobDetail.distance_miles;
    if (miles <= 120) return 18;
    if (miles <= 240) return 22;
    return 25;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!jobDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {"This job doesn't exist or you don't have access to it."}
            </p>
            <Button onClick={() => navigate("/driver/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto p-4 space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/driver/dashboard")}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Job Details</h1>
        </div>

        {/* Job Title Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="h-5 w-5" />
              {getJobTitle()}
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(jobDetail.status)}
              <span className="text-sm text-white/70">
                Created {formatDate(jobDetail.created_at)}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Actions - Mobile Optimized */}
        {(jobDetail.status === "open" ||
          jobDetail.status === "in_progress") && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  onClick={() =>
                    handleNavigate(
                      jobDetail.pickup_address,
                      jobDetail.pickup_lat,
                      jobDetail.pickup_lng,
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Navigation className="h-4 w-4" />
                  Navigate
                </Button>
                <Button
                  onClick={handleTakePhoto}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Camera className="h-4 w-4" />
                  Photo
                </Button>
              </div>

              {/* Status Actions */}
              {jobDetail.status === "open" && (
                <Button
                  onClick={() => handleJobStatusUpdate("start")}
                  disabled={isUpdatingStatus}
                  className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4" />
                  {isUpdatingStatus ? "Starting..." : "Start Job"}
                </Button>
              )}

              {jobDetail.status === "in_progress" && (
                <Button
                  onClick={() => handleJobStatusUpdate("complete")}
                  disabled={isUpdatingStatus}
                  className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isUpdatingStatus ? "Completing..." : "Complete Job"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vehicle Information */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Vehicle:</span>
              <span className="text-white font-medium">{getJobTitle()}</span>
            </div>
            {jobDetail.vin && (
              <div className="flex justify-between">
                <span className="text-white/70">VIN:</span>
                <span className="text-white font-mono text-sm">
                  {jobDetail.vin}
                </span>
              </div>
            )}
            {jobDetail.transmission && (
              <div className="flex justify-between">
                <span className="text-white/70">Transmission:</span>
                <span className="text-white capitalize">
                  {jobDetail.transmission}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/70">Job Type:</span>
              <Badge variant="outline" className="text-white border-white/30">
                {jobDetail.type === "swap" ? "Swap" : "Delivery"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Customer:</span>
              <span className="text-white font-medium">
                {jobDetail.customer_name || "N/A"}
              </span>
            </div>
            {jobDetail.customer_phone && (
              <div className="flex justify-between items-center">
                <span className="text-white/70">Phone:</span>
                <Button
                  onClick={() => handleCall(jobDetail.customer_phone!)}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-blue-400 hover:text-blue-300"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  {jobDetail.customer_phone}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Status:</span>
              {getStatusBadge(jobDetail.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Distance:</span>
              <span className="text-white">
                {jobDetail.distance_miles} miles
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Pay:</span>
              <span className="text-green-400 font-semibold">
                {formatCurrency(calculatePay())}
              </span>
            </div>
            {(jobDetail.timeframe || jobDetail.specific_date) && (
              <div className="flex justify-between">
                <span className="text-white/70">Timeframe:</span>
                <span className="text-white">
                  {jobDetail.timeframe || jobDetail.specific_date}
                </span>
              </div>
            )}
            {jobDetail.specific_time && (
              <div className="flex justify-between">
                <span className="text-white/70">Time:</span>
                <span className="text-white">{jobDetail.specific_time}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addresses with Navigation */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">Pickup:</span>
                <Button
                  onClick={() =>
                    handleNavigate(
                      jobDetail.pickup_address,
                      jobDetail.pickup_lat,
                      jobDetail.pickup_lng,
                    )
                  }
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-blue-400 hover:text-blue-300"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-white text-sm bg-white/5 p-3 rounded border-l-4 border-green-500">
                {jobDetail.pickup_address}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">Delivery:</span>
                <Button
                  onClick={() =>
                    handleNavigate(
                      jobDetail.delivery_address,
                      jobDetail.delivery_lat,
                      jobDetail.delivery_lng,
                    )
                  }
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-blue-400 hover:text-blue-300"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-white text-sm bg-white/5 p-3 rounded border-l-4 border-red-500">
                {jobDetail.delivery_address}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {jobDetail.notes && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 text-sm">{jobDetail.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Created:</span>
              <span className="text-white">
                {formatDate(jobDetail.created_at)}
              </span>
            </div>
            {jobDetail.assignments[0]?.accepted_at && (
              <div className="flex justify-between">
                <span className="text-white/70">Accepted:</span>
                <span className="text-white">
                  {formatDate(jobDetail.assignments[0].accepted_at)}
                </span>
              </div>
            )}
            {jobDetail.assignments[0]?.started_at && (
              <div className="flex justify-between">
                <span className="text-white/70">Started:</span>
                <span className="text-white">
                  {formatDate(jobDetail.assignments[0].started_at)}
                </span>
              </div>
            )}
            {jobDetail.assignments[0]?.ended_at && (
              <div className="flex justify-between">
                <span className="text-white/70">Completed:</span>
                <span className="text-white">
                  {formatDate(jobDetail.assignments[0].ended_at)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Button */}
        {jobDetail.assignments[0]?.id && (
          <div className="fixed bottom-6 right-6">
            <ChatButton
              jobId={jobDetail.id}
              assignmentId={jobDetail.assignments[0].id}
              currentUserType="driver"
              currentUserId={userProfile?.driver_id || ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}
