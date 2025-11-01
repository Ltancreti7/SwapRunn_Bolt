import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  RefreshCw,
  Plus,
  Clock,
  User,
  Building2,
  Star,
  MapPin,
  Mail,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { MobilePullToRefresh } from "@/components/ui/mobile-pull-to-refresh";
import { useToast } from "@/hooks/use-toast";
import { EditDealerProfile } from "@/components/dealer/EditDealerProfile";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { DealerProfilePhoto } from "@/components/dealer/DealerProfilePhoto";
import { JobStatsCard } from "@/components/dealer/JobStatsCard";
import { JobCard } from "@/components/dealer/JobCard";
import { AssignmentCard } from "@/components/dealer/AssignmentCard";
import { PendingDriverApproval } from "@/components/dealer/PendingDriverApproval";

import mapBackgroundImage from "@/assets/map-background.jpg";
import { Job as SupabaseJob } from "@/services/supabaseService";

// Extend the Job type to match what JobCard expects
interface Job extends SupabaseJob {
  pickup_address: string;
  delivery_address: string;
}

interface DealerData {
  id: string;
  name: string;
  email: string;
  store?: string;
  profile_photo_url?: string;
  created_at: string;
  position?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
}
interface ActiveAssignment {
  id: string;
  job_id: string;
  driver_id: string;
  accepted_at: string;
  started_at?: string;
  jobs: {
    id: string;
    type: string;
    pickup_address: string;
    delivery_address: string;
    year?: number;
    make?: string;
    model?: string;
    customer_name?: string;
    distance_miles?: number;
    created_at: string;
    created_by?: string;
  };
  drivers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    rating_avg?: number;
    rating_count?: number;
    profile_photo_url?: string;
    available?: boolean;
    day_off?: string;
    max_miles?: number;
    city_ok?: boolean;
    trust_score?: number;
  };
}
const DealerDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerData, setDealerData] = useState<DealerData | null>(null);
  const [activeAssignments, setActiveAssignments] = useState<
    ActiveAssignment[]
  >([]);
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadMessages();
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    if (!userProfile?.dealer_id) return;
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          assignments(*)
        `,
        )
        .eq("dealer_id", userProfile.dealer_id)
        .order("created_at", {
          ascending: false,
        });
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      logger.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.dealer_id]);

  const fetchActiveAssignments = useCallback(async () => {
    if (!userProfile?.dealer_id) return;
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          id,
          job_id,
          driver_id,
          accepted_at,
          started_at,
          jobs!inner (
            id,
            type,
            pickup_address,
            delivery_address,
            year,
            make,
            model,
            customer_name,
            distance_miles,
            created_at,
            created_by,
            dealer_id
          )
        `,
        )
        .eq("jobs.dealer_id", userProfile.dealer_id)
        .eq("jobs.status", "accepted")
        .order("accepted_at", {
          ascending: false,
        });
      if (error) {
        console.error("❌ Error fetching active assignments:", error);
        return;
      }
      setActiveAssignments(data || []);
    } catch (error) {
      console.error("❌ Error in fetchActiveAssignments:", error);
    }
  }, [userProfile?.dealer_id]);

  const fetchDealerData = useCallback(async () => {
    if (!userProfile?.dealer_id) return;
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .eq("id", userProfile.dealer_id)
        .single();
      if (error) throw error;
      setDealerData(data);
    } catch (error) {
      console.error("Error fetching dealer data:", error);
    }
  }, [userProfile?.dealer_id]);

  useEffect(() => {
    if (userProfile?.user_type === "dealer") {
      fetchJobs();
      fetchDealerData();
      fetchActiveAssignments();
    }
  }, [userProfile, fetchJobs, fetchDealerData, fetchActiveAssignments]);

  // Enhanced real-time subscription with error recovery
  useEffect(() => {
    if (!userProfile?.dealer_id) return;
    const channel = supabase
      .channel(`dealer-jobs-${userProfile.dealer_id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `dealer_id=eq.${userProfile.dealer_id}`,
        },
        (payload) => {
          // Immediately refresh data when job status changes
          fetchActiveAssignments();
          fetchDealerData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assignments",
        },
        (payload) => {
          toast({
            title: "Driver Assigned!",
            description: "A driver has accepted your job request.",
            duration: 5000,
          });
          fetchJobs();
          fetchActiveAssignments();
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Real-time subscription error");
          toast({
            title: "Connection Issue",
            description:
              "Real-time updates may be delayed. Trying to reconnect...",
            variant: "destructive",
          });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    userProfile?.dealer_id,
    toast,
    fetchActiveAssignments,
    fetchDealerData,
    fetchJobs,
  ]);

  const handleRefreshJobs = useCallback(async () => {
    await fetchJobs();
    await fetchActiveAssignments();

    if (!userProfile?.dealer_id) return;

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          id,
          job_id,
          driver_id,
          accepted_at,
          started_at,
          jobs!inner (
            id,
            type,
            pickup_address,
            delivery_address,
            year,
            make,
            model,
            customer_name,
            distance_miles,
            created_at,
            created_by,
            dealer_id
          )
        `,
        )
        .eq("jobs.dealer_id", userProfile.dealer_id)
        .is("completed_at", null)
        .not("accepted_at", "is", null)
        .order("accepted_at", {
          ascending: false,
        });

      if (error) {
        console.error("❌ Error fetching active assignments:", error);
        return;
      }

      setActiveAssignments(data || []);

      toast({
        title: "Jobs Refreshed",
        description: "Checking for new job updates...",
      });
    } catch (error) {
      console.error("❌ Error in fetchActiveAssignments:", error);
    }
  }, [userProfile?.dealer_id, fetchJobs, fetchActiveAssignments, toast]);

  const handleDealerProfileUpdate = (updatedData: Partial<DealerData>) => {
    setDealerData((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };


  if (loading) {
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/40 z-0"></div>
        <div className="relative z-10 container mx-auto px-4 pt-20 pb-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-32 bg-white/10 rounded-2xl"></div>
            <div className="h-64 bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }
  const openJobs = jobs.filter((job) => job.status === "open").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;

  return (
    <>
      <title>Dealer Dashboard | SwapRunn</title>
      <meta
        name="description"
        content="Manage your vehicle deliveries and track driver requests from your SwapRunn dealer dashboard."
      />
      <link rel="canonical" href="/dealer/dashboard" />

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
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/40 z-0"></div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Page Header */}
            <div className="text-center flex items-center justify-center">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-white mb-2 sm:mb-4">
                  Dealer Portal
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-white/80 font-light px-4">
                  Manage your deliveries and track driver assignments
                </p>
              </div>
            </div>

            {/* Horizontal Navigation Tabs */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl h-auto p-1 sm:p-2 gap-1 sm:gap-2 shadow-lg">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-2 sm:py-3 border-0"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-2 sm:py-3 border-0 relative"
                >
                  Pending
                  {openJobs > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#E11900] text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center shadow-lg text-[10px] sm:text-xs">
                      {openJobs}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="assigned"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-2 sm:py-3 border-0 relative"
                  onClick={() => setNewAssignmentsCount(0)}
                >
                  Assigned
                  {newAssignmentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center shadow-lg animate-pulse text-[10px] sm:text-xs">
                      {newAssignmentsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="done"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-2 sm:py-3 border-0"
                >
                  Done
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent
                value="profile"
                className="mt-2 space-y-4 sm:space-y-6 animate-fade-in"
              >
                {/* Request Button - Moved above profile card */}
                <Link to="/dealer/create-job" className="w-full">
                  <Button className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white h-10 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Request Driver
                  </Button>
                </Link>

                {/* Pending Driver Approvals - Only shows if there are pending drivers */}
                <PendingDriverApproval />

                <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-xl sm:rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col items-center gap-6 sm:gap-8 md:flex-row md:items-start md:gap-12">
                      <div className="flex-shrink-0">
                        <DealerProfilePhoto
                          photoUrl={dealerData?.profile_photo_url}
                          dealerName={dealerData?.name}
                        />
                      </div>
                      <div className="flex-1 w-full min-w-0 text-center md:text-left">
                        <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8 md:flex-row md:items-center">
                          <Star className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-400 fill-current flex-shrink-0" />
                          <div className="flex flex-col text-center md:text-left">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                              {dealerData?.name}
                            </h1>
                            {dealerData?.store ? (
                              <span className="text-xs sm:text-sm text-white/70 mt-1">
                                {dealerData.store}
                              </span>
                            ) : (
                              <button
                                onClick={() => setIsEditProfileOpen(true)}
                                className="text-xs sm:text-sm text-white/50 hover:text-[#E11900] mt-1 underline"
                              >
                                Add your dealership
                              </button>
                            )}
                            {dealerData?.position && (
                              <span className="text-base sm:text-lg md:text-xl text-white/90 font-medium mt-2">
                                {dealerData.position}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                          <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 flex-shrink-0" />
                            <span className="text-sm sm:text-base break-all md:truncate">
                              {dealerData?.email || user?.email}
                            </span>
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 flex-shrink-0" />
                            <span className="text-sm sm:text-base">
                              Member since{" "}
                              {new Date(
                                dealerData?.created_at || "",
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-2 sm:gap-4">
                          <Button
                            onClick={() => setIsEditProfileOpen(true)}
                            variant="outline"
                            className="w-full sm:w-auto h-10 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl border-white/40 text-slate-950 bg-white hover:bg-white/90 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            Edit Personal Info
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <JobStatsCard
                  openJobs={openJobs}
                  assignedJobs={activeAssignments.length}
                  completedJobs={completedJobs}
                  totalUnread={0}
                />
              </TabsContent>

              {/* Pending Tab */}
              <TabsContent
                value="pending"
                className="mt-2 space-y-4 sm:space-y-6 animate-fade-in"
              >
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 px-2 sm:px-0">
                  Pending Drives
                </h3>

                {openJobs > 0 ? (
                  <div className="grid gap-3 sm:gap-4">
                    {jobs
                      .filter((job) => job.status === "open")
                      .map((job) => (
                        <JobCard key={job.id} job={job} onCancel={fetchJobs} />
                      ))}
                  </div>
                ) : (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg rounded-xl sm:rounded-2xl">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Truck className="h-16 w-16 sm:h-20 sm:w-20 text-white/30 mx-auto mb-4 sm:mb-6" />
                      <h4 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">
                        No Pending Drives
                      </h4>
                      <p className="text-white/60 text-base sm:text-lg">
                        Create a new delivery request to get started.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Assigned Tab */}
              <TabsContent
                value="assigned"
                className="mt-2 space-y-4 sm:space-y-6 animate-fade-in"
              >
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 px-2 sm:px-4">
                  Active Assignments
                </h3>

                {activeAssignments.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {activeAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        currentUserId={userProfile?.user_id || ""}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg rounded-xl sm:rounded-2xl">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <User className="h-16 w-16 sm:h-20 sm:w-20 text-white/30 mx-auto mb-4 sm:mb-6" />
                      <h4 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">
                        No Assigned Jobs
                      </h4>
                      <p className="text-white/60 text-base sm:text-lg">
                        No drivers are currently assigned to jobs.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Done Tab */}
              <TabsContent
                value="done"
                className="mt-2 space-y-4 sm:space-y-6 animate-fade-in"
              >
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 px-2 sm:px-0">
                  Complete
                </h3>

                {completedJobs > 0 ? (
                  <div className="grid gap-3 sm:gap-4">
                    {jobs
                      .filter((job) => job.status === "completed")
                      .map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                  </div>
                ) : (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg rounded-xl sm:rounded-2xl">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Clock className="h-16 w-16 sm:h-20 sm:w-20 text-white/30 mx-auto mb-4 sm:mb-6" />
                      <h4 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">
                        No Completed Jobs
                      </h4>
                      <p className="text-white/60 text-base sm:text-lg">
                        Your completed jobs will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 py-8 sm:py-12 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src="/swaprunn-logo-2025.png?v=20251001"
                  alt="SwapRunn"
                  className="h-6 sm:h-8 w-auto"
                />
                <span className="text-white/70 text-sm sm:text-base">
                  © SwapRunn
                </span>
              </div>

              <div className="flex gap-4 sm:gap-6">
                <Link
                  to="/privacy"
                  className="text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Privacy
                </Link>
                <Link
                  to="/terms"
                  className="text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Terms
                </Link>
                <Link
                  to="/about"
                  className="text-white/70 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Edit Profile Modal */}
      {dealerData && (
        <EditDealerProfile
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          dealerData={dealerData}
          onUpdate={handleDealerProfileUpdate}
        />
      )}
    </>
  );
};

export default DealerDashboard;
