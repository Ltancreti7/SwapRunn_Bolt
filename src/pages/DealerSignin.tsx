import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";
import { Eye, EyeOff } from "lucide-react";

const DealerSignin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dealer/admin", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) throw error;

      // Verify this is a dealer account
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, dealer_id")
        .eq("user_id", data.user.id)
        .single();

      if (profile?.user_type !== "dealer") {
        await supabase.auth.signOut();
        throw new Error("This account is not registered as a dealer.");
      }

      if (!profile?.dealer_id) {
        toast({
          title: "Account Setup Incomplete",
          description: "Your dealership profile needs to be set up. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });

      navigate("/dealer/admin", { replace: true });
    } catch (error: any) {
      console.error("Signin error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <BackButton />
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Logo size="auth" />
          <h1 className="text-4xl font-bold mt-6 mb-2">
            Dealer <span className="text-[#E11900]">Sign In</span>
          </h1>
          <p className="text-white/70">Welcome back! Access your dashboard</p>
        </div>

        <Card className="bg-[#1A1A1A] border-white/10">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@dealership.com"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData({ ...formData, rememberMe: e.target.checked })
                    }
                    className="rounded border-white/20 bg-white/10"
                  />
                  Remember me
                </label>
                <a
                  href="/auth/reset"
                  className="text-sm text-[#E11900] hover:text-[#E11900]/80"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E11900] hover:bg-[#E11900]/90 text-white h-12 rounded-xl text-lg font-bold"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-white/60">
              Don't have an account?{" "}
              <a
                href="/dealers/registration"
                className="text-[#E11900] hover:text-[#E11900]/80 font-semibold"
              >
                Register your dealership
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealerSignin;
