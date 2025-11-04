import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import mapBackgroundImage from "@/assets/map-background.jpg";

const PasswordUpdate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    setHashParams(params);
    setIsRecovery(params.get("type") === "recovery");
  }, []);

  useEffect(() => {
    if (!hashParams) return;
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      toast({
        title: "Invalid reset link",
        description: "Request a new password reset email.",
        variant: "destructive",
      });
      navigate("/auth/reset", { replace: true });
      return;
    }

    const establishSession = async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        toast({
          title: "Session expired",
          description: "Request a new password reset email.",
          variant: "destructive",
        });
        navigate("/auth/reset", { replace: true });
        return;
      }

      setSessionReady(true);
    };

    establishSession();
  }, [hashParams, navigate, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!sessionReady) return;

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: trimmedPassword,
      });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "You can now sign in with your new credentials.",
      });

      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      const code = (error as { code?: string })?.code;
      toast({
        title: "Unable to update password",
        description: code ? `${message} (code: ${code})` : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${mapBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 z-0" />

      <div className="relative z-10 container max-w-7xl mx-auto px-4 sm:px-6 pt-28">
        <div className="text-center mb-6">
          <h1 className="font-bold text-white mb-2 text-4xl">
            Set New <span className="text-[#E11900]">Password</span>
            <span className="text-[#E11900]">.</span>
          </h1>
          <p className="text-white/80 text-lg">
            {isRecovery
              ? "Create a new password to regain access to your account."
              : "This link looks incorrect. Request a fresh reset email."}
          </p>
        </div>

        <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-transparent">
          <CardContent className="space-y-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-white text-sm font-medium"
                >
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20"
                  minLength={8}
                  required
                  disabled={!sessionReady}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-white text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter new password"
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[#E11900] focus:ring-2 focus:ring-[#E11900]/20"
                  minLength={8}
                  required
                  disabled={!sessionReady}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#E11900] hover:bg-[#B51400] text-white font-semibold text-base rounded-xl transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl"
                disabled={loading || !sessionReady || !isRecovery}
              >
                {loading ? "Saving..." : "Update Password"}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white/80 hover:text-white"
              onClick={() => navigate("/", { replace: true })}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordUpdate;
