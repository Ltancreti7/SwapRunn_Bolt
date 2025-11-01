import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, User, Calendar, Phone, MapPin, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mapBackgroundImage from "@/assets/map-background.jpg";
import { ProfilePhoto } from "@/components/driver/ProfilePhoto";
import { EditDriverProfile } from "@/components/driver/EditDriverProfile";
import type {
  JobData,
  EarningsData,
  DriverProfile,
} from "@/services/driver-data";

interface DriverData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
  created_at: string;
  rating_avg?: number;
  rating_count?: number;
  max_miles?: number;
  city_ok?: boolean;
  available?: boolean;
}

export default function DriverDashboard() {
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [upcomingJobs, setUpcomingJobs] = useState<
    Array<{
      id: string;
      accepted_at: string;
      started_at?: string | null;
      jobs: {
        id: string;
        type: string;
        pickup_address: string;
        delivery_address: string;
        year: number;
        make: string;
        model: string;
        customer_name: string;
        distance_miles: number;
        vin?: string;
      };
    }>
  >([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch open jobs (available requests)
  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform to JobData format
      const transformedJobs: JobData[] = (data || []).map((job) => ({
        id: job.id,
        pickup: job.pickup_address || "",
        dropoff: job.delivery_address || "",
        distanceMi: Number(job.distance_miles) || 0,
        pay: 0,
        status: "Upcoming" as const,
        vehicleMake: job.make,
        vehicleModel: job.model,
        vehicleYear: job.year,
        vin: job.vin,
      }));

      setJobs(transformedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setJobsLoading(false);
    }
  };

  // Fetch upcoming jobs (accepted but not started)
  const fetchUpcomingJobs = async () => {
    if (!userProfile?.driver_id) return;

    setUpcomingLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          id,
          accepted_at,
          started_at,
          jobs!inner(
            id,
            type,
            pickup_address,
            delivery_address,
            year,
            make,
            model,
            customer_name,
            distance_miles,
            vin
          )
        `,
        )
        .eq("driver_id", userProfile.driver_id)
        .is("started_at", null)
        .not("accepted_at", "is", null)
        .order("accepted_at", { ascending: false });

      if (error) throw error;

      setUpcomingJobs(data || []);
    } catch (error) {
      console.error("Error fetching upcoming jobs:", error);
    } finally {
      setUpcomingLoading(false);
    }
  };

  // Fetch earnings
  const fetchEarnings = async () => {
    if (!userProfile?.driver_id) return;

    setEarningsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .eq("driver_id", userProfile.driver_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const total =
        data?.reduce((sum, payout) => sum + (payout.amount_cents || 0), 0) || 0;
      setEarnings({
        today: 0,
        week: 0,
        month: total / 100,
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setEarningsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userProfile?.user_type === "driver") {
      fetchDriverData();
      fetchJobs();
      fetchUpcomingJobs();
      fetchEarnings();
    }
  }, [userProfile]);

  // Set up real-time subscriptions for job updates
  useEffect(() => {
    if (!userProfile?.driver_id) return;

    // Subscribe to job changes (for open requests)
    const jobsSubscription = supabase
      .channel("driver-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          fetchJobs(); // Refresh open jobs when any job changes
        },
      )
      .subscribe();

    // Subscribe to assignment changes (for upcoming jobs)
    const assignmentsSubscription = supabase
      .channel("driver-assignments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
          filter: `driver_id=eq.${userProfile.driver_id}`,
        },
        () => {
          fetchUpcomingJobs(); // Refresh upcoming jobs when assignments change
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jobsSubscription);
      supabase.removeChannel(assignmentsSubscription);
    };
  }, [userProfile?.driver_id]);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/driver/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .single();

    if (profile?.user_type !== "driver") {
      navigate("/driver/auth");
      return;
    }
    setLoading(false);
  }

  const fetchDriverData = async () => {
    if (!userProfile?.driver_id) return;

    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", userProfile.driver_id)
        .single();

      if (error) throw error;
      setDriverData(data);
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  const handleProfileUpdate = (updatedData: Partial<DriverData>) => {
    setDriverData((prev) => (prev ? { ...prev, ...updatedData } : null));
    setIsEditingProfile(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
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
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-20 pb-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-32 bg-white/10 rounded-2xl"></div>
            <div className="h-64 bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <title>Driver Dashboard | SwapRunn</title>
      <meta
        name="description"
        content="Manage your driving jobs and earnings from your SwapRunn driver dashboard."
      />
      <meta name="updated" content="2025-10-17" />
      <link rel="canonical" href="/driver/dashboard" />

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

        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-safe pt-20 pb-12">
          <div className="space-y-6 sm:space-y-8">
            {/* Page Header */}
            <div className="text-center lg:text-left mb-8 pt-6 md:pt-0 space-y-4 md:space-y-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl md:text-6xl font-display font-black tracking-tight text-white drop-shadow-lg leading-tight">
                  Driver Dashboard
                </h1>
                <p className="text-lg md:text-2xl text-white font-medium leading-relaxed">
                  Your Requests, Deliveries & Profile
                </p>
              </div>
            </div>

            {/* Horizontal Navigation Tabs - Matching Dealer Style */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/20 rounded-2xl h-auto p-2 gap-2 shadow-lg">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-xl font-bold text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-3 border-0"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="available"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-xl font-bold text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-3 border-0 relative"
                >
                  Requests
                  {jobs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                      {jobs.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-xl font-bold text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-3 border-0 relative"
                >
                  Upcoming
                  {upcomingJobs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                      {upcomingJobs.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="earnings"
                  className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white data-[state=active]:shadow-lg text-white/70 rounded-xl font-bold text-sm transition-all duration-300 hover:text-white hover:bg-white/10 py-3 border-0"
                >
                  Completed
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab - Matching Dealer Style */}
              <TabsContent
                value="profile"
                className="mt-2 space-y-6 animate-fade-in"
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <ProfilePhoto
                            photoUrl={driverData?.profile_photo_url}
                            driverName={driverData?.name}
                          />
                          {!driverData?.profile_photo_url && (
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap shadow-lg animate-pulse">
                              📸 Add Photo
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 w-full min-w-0 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center md:items-center gap-3 mb-8">
                          <Star className="h-7 w-7 text-yellow-400 fill-current flex-shrink-0" />
                          <div className="flex flex-col">
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                              {driverData?.name}
                            </h1>
                            {driverData?.rating_avg ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg text-yellow-400 font-semibold">
                                  {driverData.rating_avg.toFixed(1)}
                                </span>
                                <span className="text-sm text-white/70">
                                  ({driverData.rating_count || 0} reviews)
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-white/50 mt-1">
                                New Driver
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                            <Mail className="h-5 w-5 text-white/60 flex-shrink-0" />
                            <span className="text-base break-all md:truncate">
                              {driverData?.email || user?.email}
                            </span>
                          </div>
                          {driverData?.phone && (
                            <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                              <Phone className="h-5 w-5 text-white/60 flex-shrink-0" />
                              <span className="text-base">
                                {driverData.phone}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                            <Calendar className="h-5 w-5 text-white/60 flex-shrink-0" />
                            <span className="text-base">
                              Driver since{" "}
                              {new Date(
                                driverData?.created_at || "",
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {driverData?.max_miles && (
                            <div className="flex items-center justify-center md:justify-start gap-3 text-white/90">
                              <MapPin className="h-5 w-5 text-white/60 flex-shrink-0" />
                              <span className="text-base">
                                Drives up to {driverData.max_miles} miles
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <Button
                            onClick={() => setIsEditingProfile(true)}
                            className="w-full sm:w-auto bg-[#E11900] hover:bg-[#E11900]/90 text-white h-12 px-8 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            <User className="h-5 w-5 mr-2" />
                            Edit Profile
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto bg-transparent border-white/25 text-white hover:bg-white/10 h-12 px-8 rounded-2xl text-base font-semibold"
                            onClick={() => navigate("/driver/requests")}
                          >
                            View All Requests
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Job Requests Tab */}
              <TabsContent
                value="available"
                className="mt-2 space-y-6 animate-fade-in"
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <h3 className="text-2xl font-bold text-white mb-4">
                        Available Requests
                      </h3>
                      {jobsLoading ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
                          <div className="h-4 bg-white/20 rounded w-1/2 mx-auto"></div>
                        </div>
                      ) : jobs.length > 0 ? (
                        <div className="space-y-4">
                          {jobs.slice(0, 3).map((job) => (
                            <div
                              key={job.id}
                              className="bg-white/5 border border-white/10 rounded-xl p-4 text-left"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-white font-semibold">
                                  {job.vehicleYear} {job.vehicleMake}{" "}
                                  {job.vehicleModel}
                                </h4>
                                <span className="text-[#E11900] font-bold">
                                  ${job.pay || "TBD"}
                                </span>
                              </div>
                              <p className="text-white/70 text-sm mb-1">
                                From: {job.pickup}
                              </p>
                              <p className="text-white/70 text-sm mb-2">
                                To: {job.dropoff}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-white/60 text-xs">
                                  {job.distanceMi} miles
                                </span>
                                <Button
                                  size="sm"
                                  className="bg-[#E11900] hover:bg-[#E11900]/90 text-white rounded-xl"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          ))}
                          {jobs.length > 3 && (
                            <Button
                              variant="outline"
                              className="w-full bg-transparent border-white/25 text-white hover:bg-white/10 rounded-xl"
                              onClick={() => navigate("/driver/requests")}
                            >
                              View All {jobs.length} Jobs
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="text-white/60">
                          No delivery requests available right now. Check back
                          later!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Upcoming Jobs Tab */}
              <TabsContent
                value="active"
                className="mt-2 space-y-6 animate-fade-in"
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <h3 className="text-2xl font-bold text-white mb-4">
                        Upcoming Deliveries
                      </h3>
                      {upcomingLoading ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
                          <div className="h-4 bg-white/20 rounded w-1/2 mx-auto"></div>
                        </div>
                      ) : upcomingJobs.length > 0 ? (
                        <div className="space-y-4">
                          {upcomingJobs.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="bg-white/5 border border-white/10 rounded-xl p-4 text-left"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-white font-semibold">
                                  {assignment.jobs.year} {assignment.jobs.make}{" "}
                                  {assignment.jobs.model}
                                </h4>
                                <span className="text-green-400 font-bold text-sm">
                                  Accepted
                                </span>
                              </div>
                              <p className="text-white/70 text-sm mb-1">
                                From: {assignment.jobs.pickup_address}
                              </p>
                              <p className="text-white/70 text-sm mb-2">
                                To: {assignment.jobs.delivery_address}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-white/60 text-xs">
                                  Accepted{" "}
                                  {new Date(
                                    assignment.accepted_at,
                                  ).toLocaleDateString()}
                                </span>
                                <Button
                                  size="sm"
                                  className="bg-[#E11900] hover:bg-[#E11900]/90 text-white rounded-xl"
                                  onClick={() =>
                                    navigate(
                                      `/driver/job/${assignment.jobs.id}`,
                                    )
                                  }
                                >
                                  Start Drive
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/60">
                          No upcoming deliveries scheduled. Accept a request to
                          get started!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Completed Jobs Tab */}
              <TabsContent
                value="earnings"
                className="mt-2 space-y-6 animate-fade-in"
              >
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-6">
                        Completed Deliveries
                      </h3>
                      {earningsLoading ? (
                        <div className="animate-pulse space-y-4">
                          <div className="h-8 bg-white/20 rounded w-1/2 mx-auto"></div>
                          <div className="h-4 bg-white/20 rounded w-3/4 mx-auto"></div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                              <h4 className="text-white/70 text-sm uppercase tracking-wide mb-2">
                                Today
                              </h4>
                              <p className="text-3xl font-bold text-white">
                                ${earnings?.today || 0}
                              </p>
                              <p className="text-xs text-white/50 mt-1">
                                Earnings
                              </p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                              <h4 className="text-white/70 text-sm uppercase tracking-wide mb-2">
                                This Week
                              </h4>
                              <p className="text-3xl font-bold text-white">
                                ${earnings?.week || 0}
                              </p>
                              <p className="text-xs text-white/50 mt-1">
                                Earnings
                              </p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                              <h4 className="text-white/70 text-sm uppercase tracking-wide mb-2">
                                This Month
                              </h4>
                              <p className="text-3xl font-bold text-[#E11900]">
                                ${earnings?.month || 0}
                              </p>
                              <p className="text-xs text-white/50 mt-1">
                                Total Earnings
                              </p>
                            </div>
                          </div>

                          <div className="text-center text-white/60 text-sm">
                            <p>
                              Your completed deliveries and earnings summary
                            </p>
                            <p className="text-xs mt-2">
                              Most recent jobs appear first • All times are
                              local
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {driverData && (
        <EditDriverProfile
          isOpen={isEditingProfile}
          onClose={() => setIsEditingProfile(false)}
          driverData={driverData}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}
