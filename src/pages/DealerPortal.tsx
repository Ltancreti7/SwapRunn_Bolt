import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Plus,
  User,
  ClipboardList,
  CheckCircle,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerProfilePhoto } from "@/components/dealer/DealerProfilePhoto";
import mapBackgroundImage from "@/assets/map-background.jpg";

const tabs = [
  { label: "Profile", icon: User, active: true },
  { label: "Pending", icon: ClipboardList },
  { label: "Assigned", icon: Settings },
  { label: "Done", icon: CheckCircle },
];

interface DealerData {
  id: string;
  name: string;
  email: string;
  profile_photo_url?: string;
  dealership_name?: string;
}

export default function DealerPortal() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [dealerData, setDealerData] = useState<DealerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingDealerProfile, setMissingDealerProfile] = useState(false);

  const fetchDealerData = useCallback(async () => {
    if (!userProfile?.dealer_id) {
      setMissingDealerProfile(true);
      setLoading(false);
      return;
    }

    setMissingDealerProfile(false);

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
    } finally {
      setLoading(false);
    }
  }, [userProfile?.dealer_id]);

  useEffect(() => {
    fetchDealerData();
  }, [fetchDealerData]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-black text-white flex items-center justify-center"
        style={{
          backgroundImage: `url(${mapBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (missingDealerProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <Card className="max-w-lg bg-black/60 backdrop-blur border border-white/20">
          <CardContent className="space-y-4 py-8 text-center">
            <h1 className="text-2xl font-semibold">Dealer profile required</h1>
            <p className="text-white/70">
              Your account is not yet linked to a dealership. Contact support or
              complete dealer onboarding to access the portal.
            </p>
            <Button
              onClick={() => navigate("/dealers/registration")}
              variant="secondary"
            >
              Start dealer registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="min-h-screen bg-black/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-20">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold">Dealer Portal</h1>
            <p className="text-sm text-white/70">
              Manage your deliveries and track driver assignments
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ label, icon: Icon, active }) => (
              <Button
                key={label}
                variant={active ? "default" : "secondary"}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                  active
                    ? "bg-[#E11900] hover:bg-[#B51400]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>

          {/* Request Button */}
          <Button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E11900] py-3 text-base font-semibold shadow-lg hover:bg-[#B51400]"
            onClick={() => navigate("/dealer/create-job")}
          >
            <Plus className="h-5 w-5" />
            Request Delivery
          </Button>

          {/* Profile Card */}
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div className="scale-[0.6] transform-gpu">
                <DealerProfilePhoto
                  photoUrl={dealerData?.profile_photo_url}
                  dealerName={dealerData?.name}
                />
              </div>

              <div className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-2 text-[#FACC15]">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Top-rated dealer partner
                  </span>
                </div>
                <h2 className="text-2xl font-bold">
                  {dealerData?.name || "Dealer Name"}
                </h2>
                <p className="text-sm text-white/70">
                  {dealerData?.dealership_name || "Dealership Name"}
                </p>
              </div>

              <Separator className="bg-white/10" />

              <div className="grid w-full gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-sm font-semibold">Open Requests</p>
                  <p className="text-xs text-white/60">
                    Live metrics appear as jobs roll in.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-sm font-semibold">On-time Delivery Rate</p>
                  <p className="text-xs text-white/60">
                    Connect real data to unlock performance stats.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
