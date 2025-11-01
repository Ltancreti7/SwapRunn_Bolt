import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowRight,
  Eye,
  Phone,
  Navigation,
  Camera,
  MapPin,
  Clock,
  User,
  Car,
  DollarSign,
  Play,
  CheckCircle,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatButton } from "@/components/chat/ChatButton";
import { useAuth } from "@/hooks/useAuth";
import { useMobileCapacitor } from "@/hooks/useMobileCapacitor";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { mobileCameraService } from "@/services/mobileCameraService";
import { mobileGeolocationService } from "@/services/mobileGeolocationService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { JobData } from "@/services/driver-data";
interface JobsProps {
  jobs: JobData[];
  isLoading: boolean;
  onJobUpdate?: () => void;
}
export function Jobs({ jobs, isLoading, onJobUpdate }: JobsProps) {
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const { userProfile } = useAuth();
  const { isNative, triggerHaptic } = useMobileCapacitor();
  const { totalUnread, getUnreadCountForJob } = useUnreadMessages();
  const navigate = useNavigate();
  const upcomingJobs = jobs.filter((job) => job.status === "Upcoming");
  const completedJobs = jobs.filter((job) => job.status === "Completed");
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
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
      case "Upcoming":
        return;
      case "Completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "Cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getJobTitle = (job: JobData) => {
    const year = job.vehicleYear || "";
    const make = job.vehicleMake || "";
    const model = job.vehicleModel || "";
    const type = job.jobType === "swap" ? "Swap" : "Delivery";
    if (year && make && model) {
      return `${year} ${make} ${model} ${type}`;
    } else if (make && model) {
      return `${make} ${model} ${type}`;
    } else if (job.customerName) {
      return `${type} for ${job.customerName}`;
    }
    return `Vehicle ${type}`;
  };

  // Fetch detailed job information when selected
  useEffect(() => {
    if (selectedJob?.id) {
      fetchJobDetails(selectedJob.id);
    }
  }, [selectedJob]);

  const fetchJobDetails = async (jobId: string) => {
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
      setJobDetails(data);
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  const handleJobStatusUpdate = async (action: "start" | "complete") => {
    if (!selectedJob?.assignmentId || !userProfile?.driver_id) return;

    setIsUpdatingStatus(true);
    try {
      const updateField = action === "start" ? "started_at" : "ended_at";
      const statusValue = action === "start" ? "in_progress" : "completed";

      // Update assignment
      const { error: assignmentError } = await supabase
        .from("assignments")
        .update({ [updateField]: new Date().toISOString() })
        .eq("id", selectedJob.assignmentId);

      if (assignmentError) throw assignmentError;

      // Update job status
      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: statusValue })
        .eq("id", selectedJob.id);

      if (jobError) throw jobError;

      toast({
        title: action === "start" ? "Job Started" : "Job Completed",
        description:
          action === "start"
            ? "You've started this job"
            : "Great work! Job marked as complete",
      });

      // Refresh job details and parent component
      await fetchJobDetails(selectedJob.id);
      onJobUpdate?.();
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

  const handleNavigate = async (address: string) => {
    await triggerHaptic();

    if (isNative) {
      // Use native navigation on mobile
      const encodedAddress = encodeURIComponent(address);
      window.open(`maps://?q=${encodedAddress}`, "_system");
    } else {
      // Use Google Maps on web
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, "_blank");
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
  const JobRow = ({ job }: { job: JobData }) => (
    <div className="p-4 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="font-semibold text-white text-sm">
            {getJobTitle(job)}
          </div>
          <div className="text-xs text-white/70">
            {job.customerName && (
              <span className="font-medium">Customer: {job.customerName}</span>
            )}
            {job.vin && (
              <span className="ml-2 font-mono">VIN: {job.vin.slice(-6)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="truncate max-w-32">{job.pickup}</span>
            <ArrowRight className="h-4 w-4 text-white/60" />
            <span className="truncate max-w-32">{job.dropoff}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>{job.distanceMi} mi</span>
          <span className="font-semibold text-text-secondary">
            {job.pay > 0 ? formatCurrency(job.pay) : "Pay TBD"}
          </span>
          {job.assignmentId &&
            getUnreadCountForJob(job.id, job.assignmentId) > 0 && (
              <div className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                <MessageSquare className="h-3 w-3" />
                {getUnreadCountForJob(job.id, job.assignmentId)}
              </div>
            )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/driver/jobs/${job.id}`)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Eye className="h-4 w-4" />
            Details
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJob(job)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                Quick View
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Details
                </SheetTitle>
              </SheetHeader>
              {selectedJob && (
                <div className="space-y-6 mt-6">
                  {/* Quick Actions - Mobile Optimized */}
                  {selectedJob.status === "Upcoming" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleNavigate(selectedJob.pickup)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate
                      </Button>
                      <Button
                        onClick={handleTakePhoto}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Photo
                      </Button>
                    </div>
                  )}

                  {/* Job Status Actions */}
                  {selectedJob.status === "Upcoming" && (
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleJobStatusUpdate("start")}
                        disabled={isUpdatingStatus}
                        className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4" />
                        {isUpdatingStatus ? "Starting..." : "Start Job"}
                      </Button>
                    </div>
                  )}

                  {jobDetails?.status === "in_progress" && (
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleJobStatusUpdate("complete")}
                        disabled={isUpdatingStatus}
                        className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {isUpdatingStatus ? "Completing..." : "Complete Job"}
                      </Button>
                    </div>
                  )}

                  {/* Vehicle Information */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehicle Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Vehicle:</span>
                        <span className="font-medium">
                          {getJobTitle(selectedJob)}
                        </span>
                      </div>
                      {(selectedJob.vin || jobDetails?.vin) && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">VIN:</span>
                          <span className="font-mono text-sm">
                            {selectedJob.vin || jobDetails?.vin}
                          </span>
                        </div>
                      )}
                      {jobDetails?.transmission && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            Transmission:
                          </span>
                          <span className="capitalize">
                            {jobDetails.transmission}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Job Type:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedJob.jobType === "swap" ? "Swap" : "Delivery"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Customer:</span>
                        <span className="font-medium">
                          {selectedJob.customerName ||
                            jobDetails?.customer_name ||
                            "N/A"}
                        </span>
                      </div>
                      {jobDetails?.customer_phone && (
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">Phone:</span>
                          <Button
                            onClick={() =>
                              handleCall(jobDetails.customer_phone)
                            }
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-blue-600 hover:text-blue-700"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            {jobDetails.customer_phone}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Job Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Status:</span>
                        {getStatusBadge(
                          jobDetails?.status || selectedJob.status,
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Distance:</span>
                        <span>
                          {selectedJob.distanceMi ||
                            jobDetails?.distance_miles ||
                            0}{" "}
                          miles
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Pay:</span>
                        <span className="font-semibold text-text-secondary">
                          {selectedJob.pay > 0
                            ? formatCurrency(selectedJob.pay)
                            : "TBD"}
                        </span>
                      </div>
                      {(jobDetails?.timeframe || jobDetails?.specific_date) && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            Timeframe:
                          </span>
                          <span>
                            {jobDetails.timeframe || jobDetails.specific_date}
                          </span>
                        </div>
                      )}
                      {jobDetails?.specific_time && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Time:</span>
                          <span>{jobDetails.specific_time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Addresses with Navigation */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Addresses
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-text-secondary">
                            Pickup:
                          </span>
                          <Button
                            onClick={() => handleNavigate(selectedJob.pickup)}
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-blue-600 hover:text-blue-700"
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-text-primary text-sm bg-white/5 p-2 rounded border-l-4 border-green-500">
                          {selectedJob.pickup || jobDetails?.pickup_address}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-text-secondary">
                            Delivery:
                          </span>
                          <Button
                            onClick={() => handleNavigate(selectedJob.dropoff)}
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-blue-600 hover:text-blue-700"
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-text-primary text-sm bg-white/5 p-2 rounded border-l-4 border-red-500">
                          {selectedJob.dropoff || jobDetails?.delivery_address}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {jobDetails?.notes && (
                    <div className="bg-background/50 rounded-lg p-4">
                      <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {jobDetails.notes}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timeline
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Created:</span>
                        <span className="text-sm">
                          {formatDate(jobDetails?.created_at)}
                        </span>
                      </div>
                      {(selectedJob.startedAt ||
                        jobDetails?.assignments?.[0]?.started_at) && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Started:</span>
                          <span className="text-sm">
                            {formatDate(
                              selectedJob.startedAt ||
                                jobDetails?.assignments?.[0]?.started_at,
                            )}
                          </span>
                        </div>
                      )}
                      {(selectedJob.completedAt ||
                        jobDetails?.assignments?.[0]?.ended_at) && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">
                            Completed:
                          </span>
                          <span className="text-sm">
                            {formatDate(
                              selectedJob.completedAt ||
                                jobDetails?.assignments?.[0]?.ended_at,
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Section */}
                  {selectedJob.status === "Upcoming" &&
                    selectedJob.assignmentId &&
                    userProfile?.driver_id && (
                      <div className="pt-4 border-t">
                        <ChatButton
                          jobId={selectedJob.id}
                          assignmentId={selectedJob.assignmentId}
                          currentUserType="driver"
                          currentUserId={userProfile.driver_id}
                          size="default"
                        />
                      </div>
                    )}
                </div>
              )}
            </SheetContent>
          </Sheet>

          {job.status === "Upcoming" &&
            job.assignmentId &&
            userProfile?.driver_id && (
              <ChatButton
                jobId={job.id}
                assignmentId={job.assignmentId}
                currentUserType="driver"
                currentUserId={userProfile.driver_id}
                size="sm"
              />
            )}
        </div>
      </div>
    </div>
  );
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8 text-white/60">
      <Briefcase className="h-12 w-12 mx-auto mb-3 text-white/30" />
      <p>{message}</p>
    </div>
  );
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Briefcase className="h-5 w-5" />
          Upcoming / Recent Jobs
        </h2>
        <div className="space-y-4">
          {Array.from({
            length: 3,
          }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-full bg-white/10 backdrop-blur-sm rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Briefcase className="h-5 w-5" />
        Upcoming / Recent Jobs
      </h2>
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
          >
            <div className="flex items-center gap-2">
              Upcoming ({upcomingJobs.length})
              {totalUnread > 0 && (
                <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {totalUnread}
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
          >
            Completed ({completedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcomingJobs.length === 0 ? (
            <EmptyState message="No upcoming jobs. New assignments will appear here." />
          ) : (
            upcomingJobs.map((job) => <JobRow key={job.id} job={job} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedJobs.length === 0 ? (
            <EmptyState message="No completed jobs yet." />
          ) : (
            completedJobs.map((job) => <JobRow key={job.id} job={job} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
