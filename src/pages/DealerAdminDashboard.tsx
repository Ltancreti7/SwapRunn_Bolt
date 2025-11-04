import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Truck,
  Calendar,
  Settings,
  BarChart3,
  Crown,
  Phone,
  Mail,
  Star,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddDriverDialog } from "@/components/admin/AddDriverDialog";
import { StaffManagementModal } from "@/components/admin/StaffManagementModal";
import { MobileOptimizedCard } from "@/components/ui/mobile-optimized-card";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { MobileTouchFeedback } from "@/components/ui/mobile-touch-feedback";
import { MobilePullToRefresh } from "@/components/ui/mobile-pull-to-refresh";
import { MobileActionButton } from "@/components/ui/mobile-action-button";
import { MobileCardSkeleton } from "@/components/ui/mobile-skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { DealershipCodeCard } from "@/components/DealershipCodeCard";
import mapBackgroundImage from "@/assets/map-background.jpg";
import { PageMeta } from "@/components/PageMeta";

const DealerAdminDashboard = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [missingDealerProfile, setMissingDealerProfile] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const [showDriversDetail, setShowDriversDetail] = useState(false);
  const [showJobsDetail, setShowJobsDetail] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (userProfile?.user_type === "dealer") {
      fetchAdminData();
    }
  }, [userProfile]);

  const fetchAdminData = async () => {
    if (!userProfile?.dealer_id) {
      setMissingDealerProfile(true);
      setLoading(false);
      return;
    }
    setMissingDealerProfile(false);

    try {
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("dealer_id", userProfile.dealer_id)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Fetch drivers (all drivers for admin view)
      const { data: driversData, error: driversError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_type", "driver")
        .order("created_at", { ascending: false });

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // Fetch staff count
      const { count: staffCountData, error: staffError } = await supabase
        .from("dealership_staff")
        .select("*", { count: "exact", head: true })
        .eq("dealer_id", userProfile.dealer_id)
        .eq("is_active", true);

      if (staffError) throw staffError;
      setStaffCount(staffCountData || 0);
    } catch (error) {
      logger.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const thisMonthJobs = jobs.filter((job) => {
    const jobDate = new Date(job.created_at);
    const now = new Date();
    return (
      jobDate.getMonth() === now.getMonth() &&
      jobDate.getFullYear() === now.getFullYear()
    );
  });

  if (missingDealerProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <Card className="max-w-lg bg-black/60 backdrop-blur border border-white/20">
          <CardContent className="space-y-4 py-8 text-center">
            <h1 className="text-2xl font-semibold">Dealer profile required</h1>
            <p className="text-white/70">
              Link your account to a dealership to access the admin dashboard.
            </p>
            <Button onClick={() => navigate("/dealers/registration")}>
              Start dealer registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Admin Dashboard | SwapRunn"
        description="Admin dashboard for managing drivers, staff, and dealership operations on SwapRunn."
        canonical="/dealer/admin"
      />
      <div
        className="min-h-screen"
        style={{
          backgroundImage: `url(${mapBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/65"></div>

        <div className="relative z-10 pt-16">
          <MobilePullToRefresh onRefresh={fetchAdminData}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Admin Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    Admin Mode
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-white/70">
                  Manage your dealership operations, staff, and drivers
                </p>
              </div>

              {/* Quick Actions */}
              <div
                className={`grid gap-4 mb-8 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}
              >
                <MobileActionButton
                  onClick={() => setShowAddDriver(true)}
                  size="lg"
                  className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white font-semibold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add Driver
                </MobileActionButton>

                <MobileActionButton
                  onClick={() => setShowStaffManagement(true)}
                  size="lg"
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Add Employee
                </MobileActionButton>
              </div>

              {/* Admin Stats */}
              <div
                className={`grid gap-6 mb-8 ${isMobile ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}
              >
                {/* Total Drivers - Clickable */}
                <MobileTouchFeedback onClick={() => setShowDriversDetail(true)}>
                  <MobileOptimizedCard
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors"
                    clickable
                    icon={<Truck className="w-4 h-4" />}
                    title="Total Drivers"
                    subtitle={`${drivers.length} registered`}
                  >
                    <div className="text-2xl font-bold">{drivers.length}</div>
                  </MobileOptimizedCard>
                </MobileTouchFeedback>

                {/* Staff Members - Clickable */}
                <MobileTouchFeedback onClick={() => setShowStaffDetail(true)}>
                  <MobileOptimizedCard
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors"
                    clickable
                    icon={<Users className="w-4 h-4" />}
                    title="Staff Members"
                    subtitle="Active employees"
                  >
                    <div className="text-2xl font-bold">{staffCount}</div>
                  </MobileOptimizedCard>
                </MobileTouchFeedback>

                {/* Active Jobs - Clickable */}
                <MobileTouchFeedback onClick={() => setShowJobsDetail(true)}>
                  <MobileOptimizedCard
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors"
                    clickable
                    icon={<BarChart3 className="w-4 h-4" />}
                    title="Active Jobs"
                    subtitle="In progress"
                  >
                    <div className="text-2xl font-bold">
                      {jobs.filter((job) => job.status !== "completed").length}
                    </div>
                  </MobileOptimizedCard>
                </MobileTouchFeedback>

                {/* This Month */}
                <MobileOptimizedCard
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                  icon={<Calendar className="w-4 h-4" />}
                  title="This Month"
                  subtitle="Jobs created"
                >
                  <div className="text-2xl font-bold">
                    {thisMonthJobs.length}
                  </div>
                </MobileOptimizedCard>
              </div>

              {/* Quick Navigation */}
              <div
                className={`grid gap-6 mb-8 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}
              >
                <Link to="/dealer/dashboard">
                  <MobileTouchFeedback>
                    <MobileOptimizedCard
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors"
                      clickable
                      icon={<Truck className="w-5 h-5" />}
                      title="Dealer Dashboard"
                      subtitle="View standard dealer interface and manage deliveries"
                    >
                      <div></div>
                    </MobileOptimizedCard>
                  </MobileTouchFeedback>
                </Link>

                <Link to="/drivers">
                  <MobileTouchFeedback>
                    <MobileOptimizedCard
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors"
                      clickable
                      icon={<Users className="w-5 h-5" />}
                      title="Driver Directory"
                      subtitle="View all drivers, their status, and performance metrics"
                    >
                      <div></div>
                    </MobileOptimizedCard>
                  </MobileTouchFeedback>
                </Link>

                <Link to="/dealer/settings">
                  <MobileTouchFeedback>
                    <MobileOptimizedCard
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-colors"
                      clickable
                      icon={<Settings className="w-5 h-5" />}
                      title="Settings"
                      subtitle="Manage dealership settings and configuration"
                    >
                      <div></div>
                    </MobileOptimizedCard>
                  </MobileTouchFeedback>
                </Link>
              </div>

              {/* Recent Activity */}
              <MobileOptimizedCard
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                title="Recent Jobs"
              >
                {loading ? (
                  <MobileCardSkeleton count={3} />
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    No jobs found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map((job) => (
                      <MobileTouchFeedback key={job.id} variant="subtle">
                        <div
                          className={`flex justify-between items-center bg-white/5 ${isMobile ? "p-4 rounded-2xl" : "p-3 rounded-lg"}`}
                        >
                          <div>
                            <div className="font-medium">
                              {job.year} {job.make} {job.model}
                            </div>
                            <div className="text-sm text-white/60">
                              {new Date(job.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge
                            className={
                              job.status === "completed"
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : job.status === "assigned"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>
                      </MobileTouchFeedback>
                    ))}
                  </div>
                )}
              </MobileOptimizedCard>
            </div>
          </MobilePullToRefresh>
        </div>
      </div>

      {/* Add Driver Dialog */}
      <AddDriverDialog
        open={showAddDriver}
        onOpenChange={setShowAddDriver}
        onDriverAdded={fetchAdminData}
      />

      {/* Staff Management Modal */}
      {showStaffManagement && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Staff Management</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowStaffManagement(false)}
                >
                  ✕
                </Button>
              </div>
              <StaffManagementModal />
            </div>
          </div>
        </div>
      )}

      {/* Drivers Detail Dialog */}
      <MobileBottomSheet
        open={showDriversDetail}
        onOpenChange={setShowDriversDetail}
        title={`All Drivers (${drivers.length})`}
      >
        <div className="space-y-4">
          {loading ? (
            <MobileCardSkeleton count={5} />
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No drivers found
            </div>
          ) : (
            <div className="grid gap-4">
              {drivers.map((driver) => (
                <MobileOptimizedCard key={driver.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {driver.full_name || "Driver"}
                          </h3>
                          <div
                            className={`flex items-center gap-4 text-sm text-muted-foreground ${isMobile ? "flex-col items-start gap-1" : ""}`}
                          >
                            {driver.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span className={isMobile ? "text-xs" : ""}>
                                  {driver.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-4 text-sm ${isMobile ? "flex-col items-start gap-2" : ""}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            Created:{" "}
                            {new Date(
                              driver.created_at || "",
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex gap-2 ${isMobile ? "flex-col" : "flex-col"}`}
                    >
                      <Badge
                        variant={
                          driver.status === "active" ? "default" : "secondary"
                        }
                      >
                        {driver.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                </MobileOptimizedCard>
              ))}
            </div>
          )}
        </div>
      </MobileBottomSheet>

      {/* Jobs Detail Dialog */}
      <Dialog open={showJobsDetail} onOpenChange={setShowJobsDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Active Jobs (
              {jobs.filter((job) => job.status !== "completed").length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8">Loading jobs...</div>
            ) : jobs.filter((job) => job.status !== "completed").length ===
              0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active jobs found
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs
                  .filter((job) => job.status !== "completed")
                  .map((job) => (
                    <Card key={job.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">
                            {job.year} {job.make} {job.model}
                            {job.customer_name && ` - ${job.customer_name}`}
                          </h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {job.pickup_address && (
                              <div>From: {job.pickup_address}</div>
                            )}
                            {job.delivery_address && (
                              <div>To: {job.delivery_address}</div>
                            )}
                            <div>Distance: {job.distance_miles} miles</div>
                            <div>
                              Created:{" "}
                              {new Date(job.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge
                            variant={
                              job.status === "completed"
                                ? "default"
                                : job.status === "assigned"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {job.status}
                          </Badge>
                          {job.vin && (
                            <div className="text-xs text-muted-foreground">
                              VIN: {job.vin}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Detail Dialog */}
      <Dialog open={showStaffDetail} onOpenChange={setShowStaffDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff Overview
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <StaffManagementModal />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DealerAdminDashboard;
