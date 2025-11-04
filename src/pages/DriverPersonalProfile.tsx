import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Star,
  Bell,
  AlertTriangle,
  Search,
  X,
  RefreshCw,
  Check,
  Navigation,
  User,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SiteHeader from "@/components/SiteHeader";
import { ProfilePhoto } from "@/components/driver/ProfilePhoto";
import { MobilePullToRefresh } from "@/components/ui/mobile-pull-to-refresh";
import { EnhancedJobCard } from "@/components/driver/EnhancedJobCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDriverNotifications } from "@/hooks/useDriverNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { DriveTrackingCard } from "@/components/driver/DriveTrackingCard";
import { driveTrackingService } from "@/services/driveTrackingService";
import { useToast } from "@/hooks/use-toast";
import mapBackgroundImage from "@/assets/map-background.jpg";
import { PersistentDriveNotification } from "@/components/driver/PersistentDriveNotification";
import { EditDriverProfile } from "@/components/driver/EditDriverProfile";
import { RoleIndicator } from "@/components/RoleIndicator";
import { DetailedJobView } from "@/components/driver/DetailedJobView";
import { NewRequestModal } from "@/components/driver/NewRequestModal";
import { JobNotificationBanner } from "@/components/driver/JobNotificationBanner";
interface JobData {
  id: string;
  type: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  distance_miles: number;
  requires_two: boolean;
  notes?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  customer_name?: string;
  customer_phone?: string;
  dealer_name?: string;
  dealer_store?: string;
  estimated_pay_cents?: number;
  timeframe?: string;
  specific_time?: string;
  salesperson_name?: string;
  salesperson_phone?: string;
}
interface AssignmentData {
  id: string;
  job_id: string;
  driver_id: string;
  accepted_at?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  jobs: JobData;
}
interface DriverData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rating_avg: number;
  rating_count: number;
  profile_photo_url?: string;
  available: boolean;
  trust_score: number;
  profile_completion_percentage: number;
  created_at: string;
  day_off?: string;
}
function DriverPersonalProfile() {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [upcomingAssignments, setUpcomingAssignments] = useState<
    AssignmentData[]
  >([]);
  const [completedJobs, setCompletedJobs] = useState<JobData[]>([]);
  const [availableJobs, setAvailableJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const {
    newJobsCount,
    latestJob,
    showAlert,
    clearAlert,
    markJobsSeen,
    fetchUnseenJobsCount,
  } = useDriverNotifications();
  useEffect(() => {
    if (userProfile?.driver_id) {
      fetchDriverData();
    }
  }, [userProfile]);

  useEffect(() => {
    // Resume tracking if needed on component mount
    driveTrackingService.resumeTrackingIfNeeded();
  }, []);

  // Listen for new job notifications to refresh available jobs
  useEffect(() => {
    const handleNewJob = () => {
      console.log("Refreshing available jobs due to new job notification");
      fetchDriverData();
    };

    window.addEventListener("newJobAvailable", handleNewJob);

    return () => {
      window.removeEventListener("newJobAvailable", handleNewJob);
    };
  }, []);
  const fetchDriverData = async () => {
    if (!userProfile?.driver_id) return;
    try {
      // Fetch driver details
      const { data: driver, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", userProfile.driver_id)
        .single();
      if (driverError) throw driverError;

      // Fetch upcoming assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select(
          `
          *,
          jobs!inner(*)
        `,
        )
        .eq("driver_id", userProfile.driver_id)
        .in("jobs.status", ["assigned", "in_progress"])
        .order("created_at", {
          ascending: false,
        });
      if (assignmentsError) throw assignmentsError;

      // Fetch completed jobs
      const { data: completed, error: completedError } = await supabase
        .from("assignments")
        .select(
          `
          *,
          jobs!inner(*)
        `,
        )
        .eq("driver_id", userProfile.driver_id)
        .eq("jobs.status", "completed")
        .order("created_at", {
          ascending: false,
        })
        .limit(10);
      if (completedError) throw completedError;

      // Fetch available jobs using the dedicated function
      const { data: available, error: availableError } = await supabase.rpc(
        "get_open_jobs_for_drivers",
      );
      if (availableError) throw availableError;
      setDriverData(driver);
      setUpcomingAssignments(assignments || []);
      setCompletedJobs(completed?.map((a) => a.jobs) || []);
      setAvailableJobs(available || []);
    } catch (error) {
      console.error("Error fetching driver data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDriveComplete = () => {
    // Refresh data when a drive is completed
    fetchDriverData();
  };
  const handleJobAccept = async (jobId: string) => {
    if (!userProfile?.driver_id) return;
    try {
      // Create assignment
      const { error } = await supabase.from("assignments").insert({
        job_id: jobId,
        driver_id: userProfile.driver_id,
        accepted_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Update job status
      await supabase
        .from("jobs")
        .update({
          status: "assigned",
        })
        .eq("id", jobId);
      toast({
        title: "Job Accepted!",
        description:
          "You've successfully accepted this job. Check your upcoming drives.",
      });

      // Refresh data
      fetchDriverData();
    } catch (error) {
      console.error("Error accepting job:", error);
      toast({
        title: "Error",
        description: "Failed to accept the job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = (updatedData: any) => {
    setDriverData((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };
  const handleViewNewRequests = () => {
    markJobsSeen();
    fetchUnseenJobsCount();
  };
  const handleRefreshJobs = async () => {
    await fetchDriverData();
    toast({
      title: "Jobs Refreshed",
      description: "Checking for new delivery opportunities...",
    });
  };
  const formatJobTitle = (job: JobData) => {
    if (job.make && job.model && job.year) {
      return `${job.year} ${job.make} ${job.model}`;
    }
    return `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job`;
  };
  const getStatusBadge = (status: string) => {
    const colors = {
      assigned: "bg-blue-500/20 text-blue-300 border-blue-400/30",
      in_progress: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
      completed: "bg-green-500/20 text-green-300 border-green-400/30",
      open: "bg-white/10 text-white/70 border-white/20",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };
  if (loading) {
    return (
      <div
        className="min-h-screen relative bg-black"
        style={{
          backgroundImage: `url(${mapBackgroundImage})`,
          backgroundSize: "120%",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
        }}
      >
        <JobNotificationBanner
          show={showAlert}
          dealerName={latestJob?.dealer_name || "dealership"}
          onDismiss={clearAlert}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0"></div>
        <div className="relative z-10 container mx-auto px-6 pt-24 py-8">
          <div className="animate-pulse space-y-8">
            <div className="space-y-3">
              <div className="h-10 bg-white/20 rounded-lg w-64"></div>
              <div className="h-6 bg-white/10 rounded w-96"></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex gap-4">
                <div className="h-24 w-24 bg-white/10 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-white/10 rounded w-48"></div>
                  <div className="h-5 bg-white/10 rounded w-64"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-white/10 rounded-full w-24"></div>
                    <div className="h-8 bg-white/10 rounded-full w-28"></div>
                  </div>
                </div>
              </div>
              <div className="h-40 bg-white/10 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen relative bg-black"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <JobNotificationBanner
        show={showAlert}
        dealerName={latestJob?.dealer_name || "dealership"}
        onDismiss={clearAlert}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/40 z-0"></div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 pt-24 py-6 md:py-8">
        <div className="space-y-6 mx-0 px-px my-[14px]">
          {/* New Request Modal */}
          <NewRequestModal
            isOpen={showAlert}
            onDismiss={clearAlert}
            job={latestJob}
          />

          {/* Persistent Drive Notification */}
          {userProfile?.driver_id && (
            <PersistentDriveNotification driverId={userProfile.driver_id} />
          )}

          {/* Page Header */}
          <div className="text-center lg:text-left animate-fade-in">
            <h1 className="font-display font-black tracking-tight text-white mb-2 text-3xl md:text-5xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              Driver Dashboard
            </h1>
            <p className="text-base md:text-xl text-white/80 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] py-[9px] my-[10px]">
              Manage your deliveries and track your performance
            </p>
          </div>

          {/* Tabs for Drives */}
          <MobilePullToRefresh onRefresh={handleRefreshJobs}>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full animate-fade-in"
            >
              <div className="w-full mb-6 py-0 my-0 mt-4">
                <TabsList className="w-full grid grid-cols-4 gap-3 bg-transparent p-0 h-auto">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger
                    value="new-requests"
                    onClick={handleViewNewRequests}
                    className="relative"
                  >
                    Requests
                    {newJobsCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-white text-[#E11900] font-bold px-2 py-1 text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-md animate-pulse border border-[#E11900]">
                        {newJobsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="relative">
                    Up Next
                    {upcomingAssignments.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-white text-[#E11900] font-bold px-2 py-1 text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-md border border-[#E11900]">
                        {upcomingAssignments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="completed">Done</TabsTrigger>
                </TabsList>
              </div>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Profile Tab */}
                  <TabsContent
                    value="profile"
                    className="p-6 space-y-6 animate-fade-in"
                  >
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                        <ProfilePhoto
                          photoUrl={driverData?.profile_photo_url}
                          driverName={driverData?.name}
                        />
                      </div>

                      {/* Driver Information */}
                      <div className="flex-1 w-full space-y-6">
                        <div className="space-y-5 text-center md:text-left">
                          <div className="flex flex-col md:flex-row items-center md:items-center gap-3">
                            <RoleIndicator userType="driver" />
                          </div>

                          <div className="flex flex-col md:flex-row items-center md:items-center gap-5 text-white text-lg font-medium">
                            <div className="flex items-center gap-3 hover:text-[#E11900] transition-colors duration-200">
                              <Phone className="h-5 w-5 text-white/70" />
                              <span>{driverData?.phone || "No phone"}</span>
                            </div>
                            <div className="flex items-center gap-3 hover:text-[#E11900] transition-colors duration-200">
                              <Mail className="h-5 w-5 text-white/70" />
                              <span className="truncate max-w-[250px]">
                                {driverData?.email || "No email"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center md:justify-start gap-3 text-white/70 text-base">
                            <Calendar className="h-5 w-5" />
                            <span className="font-medium">
                              Member since{" "}
                              {new Date(
                                driverData?.created_at || "",
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
                            <Badge
                              className={`text-sm px-4 py-2 font-bold transition-all duration-200 ${driverData?.available ? "bg-green-500 text-white border-0 shadow-[0_4px_12px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_16px_rgba(34,197,94,0.4)] hover:scale-105" : "bg-red-500 text-white border-0 shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.4)] hover:scale-105"}`}
                            >
                              {driverData?.available
                                ? "✓ Available"
                                : "Unavailable"}
                            </Badge>

                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm px-4 py-2 font-bold">
                              <Star className="h-4 w-4 fill-current" />
                              {driverData?.rating_avg?.toFixed(1) || "5.0"} (
                              {driverData?.rating_count || 0})
                            </Badge>

                            {driverData?.day_off && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_16px_rgba(249,115,22,0.4)] hover:scale-105 transition-all duration-200 text-sm px-4 py-2 font-bold">
                                Day Off:{" "}
                                {driverData.day_off.charAt(0).toUpperCase() +
                                  driverData.day_off.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <Button
                            onClick={() => setIsEditProfileOpen(true)}
                            className="w-full sm:w-auto h-12 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-black hover:to-gray-800 text-white text-sm font-bold rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-105"
                            variant="default"
                          >
                            Edit Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* New Requests Tab */}
                  <TabsContent
                    value="new-requests"
                    className="p-6 animate-fade-in"
                  >
                    {availableJobs.length === 0 ? (
                      <div className="text-center py-20">
                        <Clock className="h-16 w-16 text-white/40 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-3">
                          No Open Requests
                        </h3>
                        <p className="text-white/70 text-lg mb-6">
                          Check back soon for new delivery opportunities
                        </p>
                        <Button
                          onClick={handleRefreshJobs}
                          className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-black hover:to-gray-800 text-white font-bold rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-105"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Jobs
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableJobs
                          .sort(
                            (a, b) =>
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime(),
                          )
                          .map((job) => (
                            <Collapsible key={job.id}>
                              <div className="bg-gradient-to-br from-gray-900/95 to-black border border-white/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                  <div className="flex-1 text-left">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-white font-bold text-lg">
                                        {formatJobTitle(job)}
                                      </h4>
                                      <Badge className="bg-[#E11900] text-white border-0 text-xs px-2 py-1">
                                        {job.type.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-white/80">
                                        <MapPin className="h-4 w-4 text-blue-400" />
                                        <span className="font-medium">
                                          From:
                                        </span>
                                        <span className="text-white/70 truncate">
                                          {job.pickup_address
                                            .split(",")
                                            .slice(1, 3)
                                            .join(",")
                                            .trim()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-white/80">
                                        <Navigation className="h-4 w-4 text-green-400" />
                                        <span className="font-medium">To:</span>
                                        <span className="text-white/70 truncate">
                                          {job.delivery_address
                                            .split(",")
                                            .slice(1, 3)
                                            .join(",")
                                            .trim()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-white/70 mt-2">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4" />
                                          <span>{job.distance_miles} mi</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="h-4 w-4" />
                                          <span className="text-[#E11900] font-bold">
                                            $
                                            {(
                                              (job.estimated_pay_cents || 0) /
                                              100
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronDown className="h-5 w-5 text-white/70 transition-transform duration-200 ui-expanded:rotate-180" />
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <div className="border-t border-white/20 p-4 space-y-4 bg-black/20">
                                    {/* Addresses */}
                                    <div className="space-y-2">
                                      <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                                        <div className="flex items-start gap-2">
                                          <Navigation className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-xs text-white/60 font-bold mb-1">
                                              PICKUP
                                            </p>
                                            <p className="text-sm text-white">
                                              {job.pickup_address}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-xs text-white/60 font-bold mb-1">
                                              DELIVERY
                                            </p>
                                            <p className="text-sm text-white">
                                              {job.delivery_address}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Details */}
                                    {(job.customer_name ||
                                      job.customer_phone ||
                                      job.notes) && (
                                      <div className="space-y-2">
                                        {job.customer_name && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-white/60" />
                                            <span className="text-white">
                                              {job.customer_name}
                                            </span>
                                          </div>
                                        )}
                                        {job.customer_phone && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-white/60" />
                                            <span className="text-white">
                                              {job.customer_phone}
                                            </span>
                                          </div>
                                        )}
                                        {job.notes && (
                                          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                                            <p className="text-xs text-white/60 font-bold mb-1">
                                              NOTES
                                            </p>
                                            <p className="text-sm text-white">
                                              {job.notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Accept Button */}
                                    <Button
                                      onClick={() => handleJobAccept(job.id)}
                                      className="w-full h-12 bg-gradient-to-r from-[#E11900] to-[#C41500] hover:from-[#C41500] hover:to-[#E11900] text-white font-bold rounded-xl shadow-lg shadow-[#E11900]/30 hover:shadow-xl hover:shadow-[#E11900]/50 transition-all duration-300"
                                    >
                                      <Check className="h-5 w-5 mr-2" />
                                      Accept Job
                                    </Button>
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="upcoming" className="p-6 animate-fade-in">
                    {upcomingAssignments.length === 0 ? (
                      <div className="text-center py-16 md:py-20">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
                          <Clock className="h-16 w-16 text-white/30 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-white mb-2 mx-0 px-[22px] my-[4px] py-[11px]">
                            No Upcoming Jobs
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingAssignments
                          .sort(
                            (a, b) =>
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime(),
                          )
                          .map((assignment) => {
                            const job = assignment.jobs;
                            const statusColors = {
                              assigned: "bg-blue-500 text-white",
                              in_progress: "bg-yellow-500 text-white",
                            };
                            const statusColor =
                              statusColors[
                                job.status as keyof typeof statusColors
                              ] || "bg-gray-500 text-white";

                            return (
                              <Collapsible key={assignment.id}>
                                <div className="bg-gradient-to-br from-gray-900/95 to-black border border-white/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-white font-bold text-lg">
                                          {formatJobTitle(job)}
                                        </h4>
                                        <Badge
                                          className={`${statusColor} border-0 text-xs px-2 py-1`}
                                        >
                                          {job.status
                                            .replace("_", " ")
                                            .toUpperCase()}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-white/70">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4" />
                                          <span>{job.distance_miles} mi</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="h-4 w-4" />
                                          <span className="text-[#E11900] font-bold">
                                            $
                                            {(
                                              (job.estimated_pay_cents || 0) /
                                              100
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronDown className="h-5 w-5 text-white/70 transition-transform duration-200 ui-expanded:rotate-180" />
                                  </CollapsibleTrigger>

                                  <CollapsibleContent>
                                    <div className="border-t border-white/20 p-4 space-y-4 bg-black/20">
                                      {/* Addresses */}
                                      <div className="space-y-2">
                                        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                                          <div className="flex items-start gap-2">
                                            <Navigation className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                              <p className="text-xs text-white/60 font-bold mb-1">
                                                PICKUP
                                              </p>
                                              <p className="text-sm text-white">
                                                {job.pickup_address}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                                          <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-red-400 mt-1 flex-shrink-0" />
                                            <div className="flex-1">
                                              <p className="text-xs text-white/60 font-bold mb-1">
                                                DELIVERY
                                              </p>
                                              <p className="text-sm text-white">
                                                {job.delivery_address}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Details */}
                                      {(job.customer_name ||
                                        job.customer_phone ||
                                        job.notes) && (
                                        <div className="space-y-2">
                                          {job.customer_name && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <User className="h-4 w-4 text-white/60" />
                                              <span className="text-white">
                                                {job.customer_name}
                                              </span>
                                            </div>
                                          )}
                                          {job.customer_phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <Phone className="h-4 w-4 text-white/60" />
                                              <span className="text-white">
                                                {job.customer_phone}
                                              </span>
                                            </div>
                                          )}
                                          {job.notes && (
                                            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-3">
                                              <p className="text-xs text-white/60 font-bold mb-1">
                                                NOTES
                                              </p>
                                              <p className="text-sm text-white">
                                                {job.notes}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Action Buttons for Job Status */}
                                      {job.status === "assigned" && (
                                        <Button
                                          onClick={() => {
                                            // Start drive action would go here
                                          }}
                                          className="w-full h-12 bg-gradient-to-r from-[#E11900] to-[#C41500] hover:from-[#C41500] hover:to-[#E11900] text-white font-bold rounded-xl shadow-lg shadow-[#E11900]/30 hover:shadow-xl hover:shadow-[#E11900]/50 transition-all duration-300"
                                        >
                                          <Navigation className="h-5 w-5 mr-2" />
                                          Start Drive
                                        </Button>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            );
                          })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="completed"
                    className="p-6 animate-fade-in"
                  >
                    {completedJobs.length === 0 ? (
                      <div className="text-center py-16 md:py-20">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
                          <Check className="h-16 w-16 text-white/30 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-white mb-2">
                            No Completed Jobs
                          </h3>
                          <p className="text-white/60">
                            Your completed deliveries will appear here
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto pb-6">
                        <div className="flex gap-4 px-4">
                          {completedJobs.map((job) => (
                            <Card
                              key={job.id}
                              className="flex-shrink-0 w-[320px] overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl hover:bg-white/15 transition-all duration-300 shadow-lg"
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h3 className="font-bold text-base text-white mb-1 truncate">
                                      {formatJobTitle(job)}
                                    </h3>
                                    <p className="text-xs text-white/60 font-medium">
                                      {new Date(
                                        job.created_at,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-bold px-3 py-1 rounded-full text-xs">
                                    ✓ Done
                                  </Badge>
                                </div>
                                <div className="space-y-2.5 text-sm">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-0.5">
                                        Pickup
                                      </p>
                                      <p className="text-white font-medium text-xs truncate">
                                        {job.pickup_address}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-[#E11900] mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-0.5">
                                        Delivery
                                      </p>
                                      <p className="text-white font-medium text-xs truncate">
                                        {job.delivery_address}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                      <span className="text-white font-semibold text-xs">
                                        {job.distance_miles} miles
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Card>
            </Tabs>
          </MobilePullToRefresh>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 mt-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/swaprunn-logo-2025.png?v=20251001"
                alt="SwapRunn"
                className="h-7 w-auto"
              />
              <span className="text-white/60 text-sm">© SwapRunn</span>
            </div>

            <div className="flex gap-6 text-sm">
              <a
                href="/privacy"
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                Terms
              </a>
              <a
                href="/about"
                className="text-white/60 hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Edit Driver Profile Modal */}
      {driverData && (
        <EditDriverProfile
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          driverData={driverData}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
export default DriverPersonalProfile;
