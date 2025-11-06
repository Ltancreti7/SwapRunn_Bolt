import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import mapBackgroundImage from "@/assets/map-background.jpg";
import BackButton from "@/components/BackButton";
import SiteHeader from "@/components/SiteHeader";
import Logo from "@/components/Logo";

const StaffSignup = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [dealershipCode, setDealershipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const positions = [
    { value: "sales", label: "Sales" },
    { value: "sales_manager", label: "Sales Manager" },
    { value: "swap_manager", label: "Swap Manager" },
    { value: "parts_manager", label: "Parts Manager" },
    { value: "service_manager", label: "Service Manager" },
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });

      navigate("/dealer/dashboard");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dealership code format
      if (!dealershipCode || dealershipCode.length !== 6) {
        throw new Error("Please enter a valid 6-character dealership code");
      }

      // First, verify the dealership code exists
      const { data: dealership, error: dealershipError } = await supabase
        .from("dealers")
        .select("id, name")
        .eq("dealership_code", dealershipCode.toUpperCase())
        .single();

      if (dealershipError || !dealership) {
        throw new Error("Dealership not found. Please contact support.");
      }

      const response = await fetch("/api/addStaff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: `${firstName} ${lastName}`,
          role: position,
          dealership_id: dealership.id,
          phone,
          is_staff_member: true,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to create staff account");
      }

      toast({
        title: "Account created successfully!",
        description: `Welcome to ${dealership.name}! Signing you in...`,
      });

      // Auto sign in after successful signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If auto sign-in fails, toggle to sign-in mode
        setIsSignUp(false);
        toast({
          title: "Please sign in",
          description: "Your account was created. Please sign in to continue.",
        });
      } else {
        navigate("/dealer/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative px-4"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/38 to-black/65"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-24">
        {/* Staff Signup Card */}
        <Card className="w-full max-w-md bg-black/30 backdrop-blur-sm border-white/20 shadow-lg rounded-2xl">
          <CardContent className="space-y-6 p-8">
            {/* Title */}
            <div className="text-center space-y-4 mb-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white font-display">
                  {isSignUp ? "Join Your Team" : "Welcome Back"}
                </h1>
                <p className="text-white/80 text-sm font-inter">
                  {isSignUp
                    ? "Sign up as a staff member"
                    : "Sign in to your dashboard"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4 text-[#E11900]" />
                <span className="text-white/90 text-sm font-inter">
                  Staff Member {isSignUp ? "Registration" : "Login"}
                </span>
              </div>
            </div>

            <form
              onSubmit={isSignUp ? handleSignUp : handleSignIn}
              className="space-y-4"
            >
              {/* Sign Up Fields */}
              {isSignUp && (
                <>
                  {/* Dealership Code */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="dealershipCode"
                      className="text-white/90 text-sm font-medium font-inter"
                    >
                      Dealership Code
                    </Label>
                    <Input
                      id="dealershipCode"
                      type="text"
                      value={dealershipCode}
                      onChange={(e) =>
                        setDealershipCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter 6-character code"
                      maxLength={6}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-ring rounded-2xl font-mono tracking-wider"
                      required
                    />
                    <p className="text-white/60 text-xs font-inter">
                      Ask your manager for the dealership code
                    </p>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-white/90 text-sm font-medium font-inter"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-ring rounded-2xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-white/90 text-sm font-medium font-inter"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-ring rounded-2xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-white/90 text-sm font-medium font-inter"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-ring rounded-2xl"
                      required
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="position"
                      className="text-white/90 text-sm font-medium font-inter"
                    >
                      Position
                    </Label>
                    <Select
                      value={position}
                      onValueChange={setPosition}
                      required
                    >
                      <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white focus:ring-2 focus:ring-ring rounded-2xl">
                        <SelectValue placeholder="Select your position" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-white/20 backdrop-blur-md">
                        {positions.map((pos) => (
                          <SelectItem
                            key={pos.value}
                            value={pos.value}
                            className="text-white hover:bg-white/10 focus:bg-white/10"
                          >
                            {pos.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {position === "sales" && (
                      <p className="text-white/70 text-xs font-inter">
                        Your position title will be set to "Client Advisor"
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Email - Common for both */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white/90 text-sm font-medium font-inter"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-ring rounded-2xl"
                  required
                />
              </div>

              {/* Password - Common for both */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-white/90 text-sm font-medium font-inter"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-ring rounded-2xl"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-[#E11900] hover:bg-[#E11900]/90 text-white font-semibold text-base rounded-2xl transition-all duration-200 active:scale-95 shadow-lg"
                disabled={loading}
              >
                {loading
                  ? isSignUp
                    ? "Creating Account..."
                    : "Signing In..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </Button>
            </form>

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-white/80 hover:text-white hover:underline transition-colors duration-200 text-sm"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up now"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffSignup;
