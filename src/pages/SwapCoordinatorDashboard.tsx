import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Mail, User, Calendar, MapPin, Clock, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mapBackgroundImage from "@/assets/map-background.jpg";

interface Job {
  id: string;
  type: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  year: number;
  make: string;
  model: string;
  customer_name: string;
  customer_phone: string;
  timeframe: string;
  notes: string;
  created_at: string;
  dealer_id: string;
  track_token: string;
}

export default function SwapCoordinatorDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile?.user_type === "swap_coordinator") {
      fetchJobs();
    }
  }, [userProfile]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/swap-coordinator/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .single();

    if (profile?.user_type !== "swap_coordinator") {
      navigate("/swap-coordinator/auth");
      return;
    }

    setLoading(false);
  }

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleRefreshJobs = async () => {
    await fetchJobs();
    toast({
      title: "Jobs Refreshed",
      description: "Checking for new updates...",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  const openJobs = jobs.filter((j) => j.status === "open");
  const assignedJobs = jobs.filter((j) => j.status === "assigned" || j.status === "in_progress");
  const completedJobs = jobs.filter((j) => j.status === "completed");

  return (
    <div
      className="min-h-screen bg-black relative"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/60 z-0"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Swap Coordinator Dashboard</h1>
            <p className="text-white/70">Manage vehicle swaps and deliveries</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefreshJobs}
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={signOut}
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <Card className="mb-8 bg-black/40 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-[#E11900] rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {userProfile?.full_name || "Swap Coordinator"}
                </h2>
                <div className="flex items-center gap-2 text-white/80">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/20 rounded-xl h-auto p-2 gap-2 shadow-lg mb-8">
            <TabsTrigger value="open" className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white text-white/70 rounded-lg font-bold transition-all duration-300 hover:text-white hover:bg-white/10 py-3">
              Open Jobs ({openJobs.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white text-white/70 rounded-lg font-bold transition-all duration-300 hover:text-white hover:bg-white/10 py-3">
              Assigned ({assignedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white text-white/70 rounded-lg font-bold transition-all duration-300 hover:text-white hover:bg-white/10 py-3">
              Completed ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {openJobs.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8 text-center">
                  <p className="text-white/70">No open jobs at the moment</p>
                </CardContent>
              </Card>
            ) : (
              openJobs.map((job) => (
                <Card key={job.id} className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        {job.year} {job.make} {job.model}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {job.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-white/80">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-white/60" />
                        <div>
                          <p className="text-sm font-medium">Pickup: {job.pickup_address}</p>
                          <p className="text-sm">Delivery: {job.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-sm">{job.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <span className="text-sm">{job.timeframe}</span>
                      </div>
                      {job.notes && (
                        <div className="mt-3 p-2 bg-white/5 rounded-lg">
                          <p className="text-sm text-white/70">{job.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            {assignedJobs.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8 text-center">
                  <p className="text-white/70">No assigned jobs at the moment</p>
                </CardContent>
              </Card>
            ) : (
              assignedJobs.map((job) => (
                <Card key={job.id} className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        {job.year} {job.make} {job.model}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        {job.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-white/80">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-white/60" />
                        <div>
                          <p className="text-sm font-medium">Pickup: {job.pickup_address}</p>
                          <p className="text-sm">Delivery: {job.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-sm">{job.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <span className="text-sm">{job.timeframe}</span>
                      </div>
                      {job.notes && (
                        <div className="mt-3 p-2 bg-white/5 rounded-lg">
                          <p className="text-sm text-white/70">{job.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedJobs.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8 text-center">
                  <p className="text-white/70">No completed jobs yet</p>
                </CardContent>
              </Card>
            ) : (
              completedJobs.map((job) => (
                <Card key={job.id} className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        {job.year} {job.make} {job.model}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        {job.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-white/80">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-white/60" />
                        <div>
                          <p className="text-sm font-medium">Pickup: {job.pickup_address}</p>
                          <p className="text-sm">Delivery: {job.delivery_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-white/60" />
                        <span className="text-sm">{job.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <span className="text-sm">{job.timeframe}</span>
                      </div>
                      {job.notes && (
                        <div className="mt-3 p-2 bg-white/5 rounded-lg">
                          <p className="text-sm text-white/70">{job.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
