import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Building2, Copy, Mail } from "lucide-react";
import { formatPhoneNumber, cleanPhoneNumber } from "@/lib/utils";
import Logo from "@/components/Logo";
import { generateDealershipCode } from "@/lib/dealershipCode";
import BackButton from "@/components/BackButton";

const DealershipRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [planType, setPlanType] = useState<"monthly" | "annual">("monthly");
  const [dealershipCode, setDealershipCode] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [pendingEmailConfirmation, setPendingEmailConfirmation] =
    useState(false);

  // Form state
  const [formData, setFormData] = useState({
    dealershipName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    dealershipPhone: "",
    website: "",
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    authorizedCheckbox: false,
    termsCheckbox: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // User is already logged in, redirect to their dashboard
          const { data: profile } = await supabase
            .rpc("get_user_profile")
            .maybeSingle();

          if (profile?.user_type === "dealer") {
            toast({
              title: "Already Logged In",
              description: "Redirecting to your dashboard...",
            });
            navigate("/dealer/admin", { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.dealershipName ||
      !formData.fullName ||
      !formData.jobTitle ||
      !formData.email ||
      !formData.password
    ) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.authorizedCheckbox || !formData.termsCheckbox) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms and confirm authorization.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Log submission attempt to Supabase (background, doesn't block UX)
      const logSubmission = async (
        status: "success" | "failure",
        errorMsg?: string,
      ) => {
        try {
          await supabase.from("form_submissions" as any).insert({
            form_type: "dealer_registration",
            name: formData.fullName,
            email: formData.email,
            message: `Dealership: ${formData.dealershipName}, Role: ${formData.jobTitle}`,
            status,
            error_message: errorMsg,
            metadata: {
              dealership_name: formData.dealershipName,
              city: formData.city,
              state: formData.state,
              plan_type: planType,
            },
          });
        } catch (err) {
          console.error("Failed to log dealer registration:", err);
        }
      };

      // Step 1: Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: "dealer",
            company_name: formData.dealershipName,
            full_name: formData.fullName,
          },
          emailRedirectTo: `${window.location.origin}/dealer/admin`,
        },
      });

      if (authError) {
        // Handle specific error cases
        if (
          authError.message.includes("already registered") ||
          authError.message.includes("already been registered")
        ) {
          await logSubmission("failure", "Email already in use");
          throw new Error(
            `This email address is already registered. Please use the login page instead or contact support if you need help accessing your account.`,
          );
        }
        throw authError;
      }
      if (!authData.user) throw new Error("Failed to create user account");

      if (!authData.session) {
        await logSubmission("success");
        setPendingEmailConfirmation(true);
        toast({
          title: "Check your email",
          description:
            "Confirm your email address to finish setting up your dealership account.",
        });
        return;
      }

      // Step 2: Wait for trigger to create profile and get dealer_id
      // The handle_new_user trigger runs async, so we need to retry with exponential backoff
      let profileData = null;
      let dealerId = null;
      const maxRetries = 10;
      const baseDelay = 200;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("dealer_id")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (!error && data?.dealer_id) {
          profileData = data;
          dealerId = data.dealer_id;
          break;
        }

        // Wait with exponential backoff before retrying
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(1.5, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!dealerId) {
        await logSubmission("failure", "Failed to create dealer profile - trigger may not have executed");
        throw new Error("Failed to create dealer profile. Please try again or contact support.");
      }

      // Generate unique dealership code
      const uniqueCode = generateDealershipCode(formData.dealershipName);
      setDealershipCode(uniqueCode);

      // Step 3: Update dealer record with complete information
      const { error: dealerError } = await supabase
        .from("dealers")
        .update({
          name: formData.fullName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          phone: cleanPhoneNumber(formData.dealershipPhone),
          website: formData.website,
          email: formData.email,
          position: formData.jobTitle,
          store: formData.dealershipName,
          dealership_code: uniqueCode,
        })
        .eq("id", dealerId);

      if (dealerError) {
        console.error("Error updating dealer:", dealerError);
        await logSubmission("failure", dealerError.message);
        throw dealerError;
      }

      // Step 4: Create subscription (test mode)
      const { data: billingData, error: billingError } =
        await supabase.functions.invoke("stripe-billing", {
          body: {
            dealerId,
            testMode: true,
            addOns: {
              gps_tracking: false,
              signature_capture: false,
            },
          },
        });

      if (billingError) {
        console.error("Billing setup error:", billingError);
        // Don't fail registration if billing fails in test mode
      }

      // Step 5: Assign user as owner in dealership_staff
      const { error: staffError } = await supabase
        .from("dealership_staff")
        .insert({
          user_id: authData.user.id,
          dealer_id: dealerId,
          role: "owner",
          is_active: true,
          joined_at: new Date().toISOString(),
        });

      if (staffError) {
        console.error("Error creating staff record:", staffError);
        // Don't fail registration if staff record creation fails
      }

      // Log successful submission
      await logSubmission("success");

      setShowSuccess(true);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Special handling for email already in use
      if (errorMessage.includes("already registered")) {
        toast({
          title: "Email Already Registered",
          description: "This email is already in use. Please sign in instead.",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dealer/auth")}
              className="ml-2"
            >
              Go to Login
            </Button>
          ),
        });
      } else {
        toast({
          title: "Registration Failed",
          description: errorMessage || "An error occurred during registration.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Checking session...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1A1A1A] border-white/10 text-white">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Welcome to SwapRunn!</h2>
              <p className="text-white/70">
                Your dealership account has been created successfully.
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Account Status</span>
                <span className="text-green-500 font-semibold">✓ Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Your Role</span>
                <span className="text-white font-semibold">Owner</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Subscription Plan</span>
                <span className="text-white font-semibold">
                  Hybrid (Test Mode)
                </span>
              </div>
              <div className="text-xs text-white/50 pt-2 border-t border-white/10">
                $99/month + $1.50 per swap
              </div>
            </div>

            <div className="bg-[#E11900]/10 border border-[#E11900]/20 rounded-2xl p-4 space-y-2">
              <p className="text-white/80 text-sm font-semibold">
                Staff Signup Code
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-2xl font-mono font-bold text-white tracking-wider">
                  {dealershipCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard.writeText(dealershipCode);
                    toast({
                      title: "Copied!",
                      description: "Dealership code copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-white/60 text-xs">
                Share this code with your staff so they can create accounts
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">1</span>
                </div>
                <h3 className="text-white font-semibold text-sm">Your Account is Ready!</h3>
              </div>
              <p className="text-white/80 text-sm">
                You're automatically logged in and can access your admin dashboard right now.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">2</span>
                </div>
                <h3 className="text-white font-semibold text-sm">Next Time You Visit</h3>
              </div>
              <p className="text-white/80 text-sm">
                Use the same email (<strong className="text-white">{formData.email}</strong>) and password you just created to sign in at the dealer login page.
              </p>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
                <p className="text-yellow-200 text-xs font-medium">
                  💡 Bookmark this: Use <strong>/dealer/auth</strong> to sign in next time
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-[#E11900] hover:bg-[#E11900]/90 h-12 rounded-2xl font-semibold"
                onClick={() => navigate("/dealer/admin")}
              >
                Go to Admin Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl border-white/20 text-white hover:bg-white/10"
                onClick={() => navigate("/dealer/auth")}
              >
                View Login Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingEmailConfirmation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#1A1A1A] border-white/10 text-white">
          <CardContent className="py-10 space-y-5 text-center">
            <div className="w-16 h-16 mx-auto bg-[#E11900]/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#E11900]" />
            </div>
            <h2 className="text-2xl font-bold">Verify your email</h2>
            <p className="text-white/70">
              We just sent a confirmation email to{" "}
              <strong>{formData.email}</strong>. Click the link inside to finish
              setting up your dealership account, then return to sign in.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate("/dealer/auth")}
              className="w-full"
            >
              Go to dealer login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <BackButton />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Logo size="auth" />
          <h1 className="text-3xl font-bold mt-6 mb-2">
            Dealership Registration
          </h1>
          <p className="text-white/70">
            Set up your dealership account in minutes
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-[#1A1A1A] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5" />
                Dealership Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dealershipName" className="text-white">
                  Dealership Name *
                </Label>
                <Input
                  id="dealershipName"
                  value={formData.dealershipName}
                  onChange={(e) =>
                    handleInputChange("dealershipName", e.target.value)
                  }
                  placeholder="Enter dealership name…"
                  className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street" className="text-white">
                    Street Address
                  </Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) =>
                      handleInputChange("street", e.target.value)
                    }
                    placeholder="Enter street address…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-white">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter city…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-white">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Enter state…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="zip" className="text-white">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleInputChange("zip", e.target.value)}
                    placeholder="Enter ZIP code…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dealershipPhone" className="text-white">
                    Phone Number
                  </Label>
                  <Input
                    id="dealershipPhone"
                    type="tel"
                    value={formData.dealershipPhone}
                    onChange={(e) =>
                      handleInputChange(
                        "dealershipPhone",
                        formatPhoneNumber(e.target.value),
                      )
                    }
                    placeholder="(802) 444-4444"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                    maxLength={14}
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-white">
                    Website (Optional)
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="Enter website (optional)…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">
                Primary Admin Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="text-white">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    placeholder="Enter full name…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jobTitle" className="text-white">
                    Job Title *
                  </Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      handleInputChange("jobTitle", e.target.value)
                    }
                    placeholder="Enter job title…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email (Login) *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange(
                        "phone",
                        formatPhoneNumber(e.target.value),
                      )
                    }
                    placeholder="(802) 444-4444"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="text-white">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Create a password…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm password…"
                    className="bg-black/50 border-white/10 text-white h-12 rounded-2xl placeholder:text-white/40"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Subscription Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white mb-4 block text-lg font-semibold">
                  Choose Your Plan
                </Label>
                <Tabs
                  value={planType}
                  onValueChange={(value) =>
                    setPlanType(value as "monthly" | "annual")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-black/50 gap-3 p-3">
                    <TabsTrigger
                      value="monthly"
                      className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white flex flex-col items-center py-4 px-4 h-auto min-h-[100px] rounded-xl border border-white/10 data-[state=active]:border-[#E11900]"
                    >
                      <span className="font-bold text-lg">Monthly</span>
                      <span className="text-2xl font-black mt-1">$99</span>
                      <span className="text-xs text-white/60 data-[state=active]:text-white/80 mt-1">
                        per month
                      </span>
                      <span className="text-xs text-white/60 data-[state=active]:text-white/80">
                        + $1.50 per delivery
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="annual"
                      className="data-[state=active]:bg-[#E11900] data-[state=active]:text-white flex flex-col items-center py-4 px-4 h-auto min-h-[100px] rounded-xl border border-white/10 data-[state=active]:border-[#E11900] relative"
                    >
                      <div className="absolute -top-2 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        SAVE 20%
                      </div>
                      <span className="font-bold text-lg">Annual</span>
                      <span className="text-2xl font-black mt-1">$79</span>
                      <span className="text-xs text-white/60 data-[state=active]:text-white/80 mt-1">
                        per month
                      </span>
                      <span className="text-xs text-white/60 data-[state=active]:text-white/80">
                        + $1.50 per delivery
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-2">
                  {"What's Included:"}
                </h4>
                <ul className="text-sm text-white/80 space-y-1">
                  <li>• Unlimited driver requests</li>
                  <li>• Real-time tracking & updates</li>
                  <li>• Customer communication tools</li>
                  <li>• Staff management dashboard</li>
                  <li>• 24/7 support</li>
                </ul>
              </div>

              <p className="text-sm text-white/60 text-center">
                <strong>14-day free trial</strong> • No setup fees • Cancel
                anytime
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Agreement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="authorized"
                  checked={formData.authorizedCheckbox}
                  onCheckedChange={(checked) =>
                    handleInputChange("authorizedCheckbox", checked as boolean)
                  }
                  className="mt-1 border-white/30"
                />
                <Label
                  htmlFor="authorized"
                  className="text-white text-sm cursor-pointer"
                >
                  I am authorized to register this business and create an
                  account on its behalf
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsCheckbox}
                  onCheckedChange={(checked) =>
                    handleInputChange("termsCheckbox", checked as boolean)
                  }
                  className="mt-1 border-white/30"
                />
                <Label
                  htmlFor="terms"
                  className="text-white text-sm cursor-pointer"
                >
                  I agree to the{" "}
                  <a href="/terms" className="text-[#E11900] underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-[#E11900] underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>

              <div className="pt-2">
                <a
                  href="/dealer-agreement.pdf"
                  download
                  className="text-[#E11900] hover:text-[#E11900]/80 text-sm underline"
                >
                  Download Dealer Agreement (PDF)
                </a>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white h-14 rounded-2xl text-lg font-bold mb-4"
          >
            {loading ? "Creating Account..." : "Create Dealership Account"}
          </Button>

          <div className="text-center">
            <p className="text-white/60 text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/dealer/auth")}
                className="text-[#E11900] hover:text-[#E11900]/80 underline font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
export default DealershipRegistration;
