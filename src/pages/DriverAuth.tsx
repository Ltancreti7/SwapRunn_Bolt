import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
// Removed password-based login; magic-link only
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber, cleanPhoneNumber } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import SiteHeader from "@/components/SiteHeader";
import { ArrowLeft } from "lucide-react";
import mapBackgroundImage from "@/assets/map-background.jpg";
import BackButton from "@/components/BackButton";
import type { User } from "@supabase/supabase-js";

type DriverMetadata = {
  user_type?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  contact_phone?: string;
};

const extractDriverMetadata = (user: User | null): DriverMetadata => {
  const raw = user?.user_metadata;
  if (raw && typeof raw === "object") {
    return raw as DriverMetadata;
  }
  return {};
};

const SAVED_EMAIL_KEY = "swaprunn_driver_saved_email";
const PENDING_DRIVER_SIGNUP = "pending_driver_signup";

interface Dealership {
  id: string;
  name: string;
  store?: string;
}

const DriverAuth = () => {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  // Password removed for magic-link flow
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedDealership, setSelectedDealership] = useState("");
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDealerships, setLoadingDealerships] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load dealerships for signup dropdown
  useEffect(() => {
    const fetchDealerships = async () => {
      setLoadingDealerships(true);
      try {
        const { data, error } = await supabase
          .from("dealers")
          .select("id, name, store")
          .eq("status", "active")
          .order("name");

        if (error) throw error;
        setDealerships(data || []);
      } catch (error) {
        console.error("Error fetching dealerships:", error);
        toast({
          title: "Error loading dealerships",
          description: "Please refresh the page to try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingDealerships(false);
      }
    };

    if (isSignUp) {
      fetchDealerships();
    }
  }, [isSignUp, toast]);

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);

    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    if (mode === "signup") {
      setIsSignUp(true);
    } else if (mode === "login") {
      setIsSignUp(false);
    }
  }, [location.search]);

  const waitForProfileCreation = async (userId: string, maxRetries = 10): Promise<boolean> => {
    const baseDelay = 200;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await supabase
        .from("profiles")
        .select("driver_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data?.driver_id) {
        return true;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(1.5, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  };

  const createDriverProfile = async (details?: {
    fullName?: string | null;
    phone?: string | null;
    dealerId?: string | null;
  }) => {
    try {
      const resolvedFullName = (details?.fullName ?? fullName).trim();
      const hasFullName = resolvedFullName.length > 0;
      const resolvedPhoneInput = details?.phone ?? phoneNumber;
      const cleanedPhone = cleanPhoneNumber(resolvedPhoneInput);
      const dealerId = details?.dealerId ?? selectedDealership;

      const { error } = await supabase.rpc("create_profile_for_current_user", {
        _user_type: "driver",
        _name: hasFullName ? resolvedFullName : null,
        _phone: cleanedPhone,
      });

      if (error) throw error;

      // Update driver record with dealer_id if provided
      if (dealerId) {
        const { data: profile } = await supabase.rpc("get_user_profile").maybeSingle();
        if (profile?.driver_id) {
          await supabase
            .from("drivers")
            .update({ dealer_id: dealerId })
            .eq("id", profile.driver_id);
        }
      }
    } catch (error) {
      console.error("Error creating driver profile:", error);
      throw error;
    }
  };

  const tryRepairDriverProfile = async (authUser: User | null) => {
    if (!authUser) return;

    const metadata = extractDriverMetadata(authUser);
    if (metadata.user_type !== "driver") {
      return;
    }

    const metadataFullName = (() => {
      const direct =
        typeof metadata.full_name === "string" ? metadata.full_name : "";
      if (direct.trim()) return direct.trim();
      const first =
        typeof metadata.first_name === "string" ? metadata.first_name : "";
      const last =
        typeof metadata.last_name === "string" ? metadata.last_name : "";
      return `${first} ${last}`.trim();
    })();

    const metadataPhoneCandidate = [
      metadata.phone,
      metadata.phone_number,
      metadata.contact_phone,
    ].find((candidate) => typeof candidate === "string" && candidate.trim());

    try {
      await createDriverProfile({
        fullName: metadataFullName || null,
        phone: metadataPhoneCandidate ?? null,
      });
    } catch (repairError) {
      console.error("Automatic driver profile repair failed:", repairError);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dealership selection on signup
    if (isSignUp && !selectedDealership) {
      toast({
        title: "Dealership Required",
        description: "Please select which dealership you'll be driving for.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Magic link only
      if (isSignUp) {
        // Stash signup info to create profile after verification
        localStorage.setItem(
          PENDING_DRIVER_SIGNUP,
          JSON.stringify({
            fullName,
            phone: cleanPhoneNumber(phoneNumber),
            dealerId: selectedDealership
          })
        );
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/driver/auth?verify=1`,
          shouldCreateUser: true,
          data: {
            user_type: "driver",
            full_name: fullName || undefined,
            phone_number: cleanPhoneNumber(phoneNumber) || undefined,
            dealer_id: isSignUp ? selectedDealership : undefined,
          },
        },
      });

      if (error) throw error;

      localStorage.setItem(SAVED_EMAIL_KEY, email);
      toast({ title: "Check your email", description: "We sent you a magic link to sign in." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Email could not be sent",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // After magic link, if user is signed in, ensure driver profile exists and redirect
  useEffect(() => {
    const completeDriverOnboarding = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      const { data: profile } = await supabase.rpc("get_user_profile").maybeSingle();
      if (profile?.user_type === "driver") {
        navigate("/driver/dashboard", { replace: true });
        return;
      }

      // Wait for trigger to create profile, fallback to manual creation if needed
      const profileCreated = await waitForProfileCreation(session.session.user.id);

      if (!profileCreated) {
        console.warn("Trigger did not create profile, attempting manual creation");
        try {
          const pendingRaw = localStorage.getItem(PENDING_DRIVER_SIGNUP);
          const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
          await createDriverProfile({
            fullName: pending?.fullName || null,
            phone: pending?.phone || null,
            dealerId: pending?.dealerId || null,
          });
          localStorage.removeItem(PENDING_DRIVER_SIGNUP);
        } catch (e) {
          console.error("Driver profile create on verify failed:", e);
        }
      }

      navigate("/driver/dashboard", { replace: true });
    };
    void completeDriverOnboarding();
  }, [navigate]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Back Button */}
      <BackButton />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-0"></div>

      {/* Content */}
      <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 pt-28">
        <div className="text-center mb-4">
          <h1 className="font-bold text-white mb-2 my-0 text-5xl">
            {isSignUp ? "Join as" : "Driver"}{" "}
            <span className="text-[#E11900]">
              {isSignUp ? "Driver" : "Login"}
            </span>
            <span className="text-[#E11900]">.</span>
          </h1>
          <p className="text-lg text-white/80 my-0">
            {isSignUp
              ? "Start earning with SwapRunn"
              : "Sign in to access your dashboard"}
          </p>
        </div>

        <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-transparent">
          <CardContent className="space-y-6">
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="fullName"
                      className="text-white text-sm font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phoneNumber"
                      className="text-white text-sm font-medium"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(formatPhoneNumber(e.target.value))
                      }
                      placeholder="(802) 444-4444"
                      className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20"
                      maxLength={14}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dealership"
                      className="text-white text-sm font-medium"
                    >
                      Select Dealership *
                    </Label>
                    <Select value={selectedDealership} onValueChange={setSelectedDealership}>
                      <SelectTrigger className="h-12 bg-white border-gray-300 text-gray-900 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20">
                        <SelectValue placeholder={loadingDealerships ? "Loading dealerships..." : "Choose your dealership"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dealerships.map((dealership) => (
                          <SelectItem key={dealership.id} value={dealership.id}>
                            {dealership.store || dealership.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-white/60 mt-1">
                      Your application will be sent to this dealership for approval
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white text-sm font-medium"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20"
                  required
                />
              </div>

              <div className="text-sm text-white/80">
                We'll send a one-time magic link to your email. No password required.
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#E11900] hover:bg-[#B51400] text-white font-semibold text-base rounded-xl transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? "Sending link..." : isSignUp ? "Send Magic Link" : "Send Magic Link"}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/20">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-white/80 hover:text-white hover:underline transition-colors duration-200 font-medium"
              >
                {isSignUp
                  ? "Already have an account? Use magic link"
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverAuth;
